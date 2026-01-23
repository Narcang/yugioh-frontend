from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import pickle
import os
from downloader import compute_phash, download_and_hash

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "data/db/phash_db.pkl"
db = {}

# Load DB on startup
@app.on_event("startup")
async def startup_event():
    global db
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'rb') as f:
            db = pickle.load(f)
        print(f"Loaded {len(db)} cards into memory.")
    else:
        print("DB not found. Please run /update_db")

@app.post("/update_db")
async def update_database():
    download_and_hash()
    with open(DB_FILE, 'rb') as f:
        global db
        db = pickle.load(f)
    return {"status": "updated", "count": len(db)}

@app.post("/identify")
async def identify_card(file: UploadFile = File(...)):
    if not db:
        return {"error": "Database not loaded"}

    # Read uploaded image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Compute hash of uploaded frame
    # NOTE: In a real scenario, we might want to detect the card box first.
    # For now, we assume the user centers the card artwork.
    target_hash = compute_phash_direct(img)
    
    if target_hash is None:
        return {"error": "Could not process image"}
        
    # Linear Search (Fast enough for <10k items in numpy)
    best_score = 0
    best_match = None
    
    # Flatten target for comparison
    target_flat = target_hash.flatten()
    
    # We can optimize this using vectorization if needed
    for cid, data in db.items():
        # Hamming distance: count differing bits
        db_flat = data['hash'].flatten()
        
        # XOR to find differences, then sum
        diff = np.count_nonzero(target_flat != db_flat)
        
        # pHash similarity: Lower diff is better. 
        # Threshold: usually < 10-15 bits difference for 64-bit hash
        if diff < 12: # Strict threshold
             # Found a potential match. Since we want the BEST match, we track min diff
             pass
             
    # Optimized Search
    # TODO: Vectorize this for production
    min_dist = 100
    best_card = None
    
    for cid, data in db.items():
        dist = np.count_nonzero(target_flat != data['hash'].flatten())
        if dist < min_dist:
            min_dist = dist
            best_card = data['name']
            
    if min_dist < 15: # Threshold for "Good Match"
        return {"match": True, "card": best_card, "distance": int(min_dist)}
    
    return {"match": False, "distance": int(min_dist)}

@app.get("/search")
async def search_card(q: str):
    if not db:
        return {"error": "Database not loaded"}
    
    q = q.lower()
    results = []
    
    # Fast linear search
    count = 0
    for cid, data in db.items():
        # Check English Name
        match = False
        if data.get('name_en') and q in data['name_en'].lower():
            match = True
        # Check Italian Name
        elif data.get('name_it') and q in data['name_it'].lower():
            match = True
            
        if match:
            # Prefer Italian name if available/matched, or standard English
            display_name = data.get('name_it') if data.get('name_it') else data['name_en']
            
            # Get image URL from ID using standard YGOPRODeck CDN
            img_url = f"https://images.ygoprodeck.com/images/cards_cropped/{cid}.jpg"
            
            results.append({
                "id": cid,
                "name": display_name,
                "image_url": img_url
            })
            count += 1
            if count >= 20: # Limit results
                break
                
    return {"results": results}

# Monkey patch compute_phash to accept img object directly
def compute_phash_direct(img):
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, (32, 32))
        dct = cv2.dct(np.float32(resized))
        dct_lowfreq = dct[0:8, 0:8]
        median = np.median(dct_lowfreq)
        return dct_lowfreq > median
    except:
        return None

# Override the import for the endpoint usage
import downloader
downloader.compute_phash = lambda path, img_object=None: compute_phash_direct(img_object) if img_object is not None else compute_phash_direct(cv2.imread(path))
