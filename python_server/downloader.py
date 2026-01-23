import os
import requests
import json
import cv2
import pickle
import numpy as np
from concurrent.futures import ThreadPoolExecutor

CARDS_API = "https://db.ygoprodeck.com/api/v7/cardinfo.php"
IMAGES_DIR = "data/images"
DB_FILE = "data/db/phash_db.pkl"

# Skip hashing actual images for now to save time if we just want SEARCH capability
# Set this to TRUE to enable image hashing
ENABLE_HASHING = False 

def compute_phash(image_path):
    if not ENABLE_HASHING: return None
    try:
        # Read image
        img = cv2.imread(image_path)
        if img is None: return None
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Resize to 32x32 for pHash
        resized = cv2.resize(gray, (32, 32))
        
        # Compute DCT
        dct = cv2.dct(np.float32(resized))
        
        # Take top-left 8x8 (excluding DC component)
        dct_lowfreq = dct[0:8, 0:8]
        
        # Compute median
        median = np.median(dct_lowfreq)
        
        # Create hash (1 if > median, 0 if < median)
        hash_bool = dct_lowfreq > median
        return hash_bool
    except Exception as e:
        print(f"Error hashing {image_path}: {e}")
        return None

def download_and_hash():
    print("Fetching English card list...")
    resp_en = requests.get(CARDS_API)
    cards_en = resp_en.json()['data']
    
    print("Fetching Italian card list...")
    try:
        resp_it = requests.get(CARDS_API + "?language=it")
        cards_it = resp_it.json()['data']
    except:
        print("Could not fetch Italian cards, defaulting to empty.")
        cards_it = []
        
    print(f"Found {len(cards_en)} EN cards and {len(cards_it)} IT cards. Processing...")

    # Build Map ID -> {names}
    card_map = {}
    
    for card in cards_en:
        cid = str(card['id'])
        card_map[cid] = {
            'name_en': card['name'],
            'name_it': None, # Will fill later
            'image': card['card_images'][0]['image_url_cropped'],
            'hash': None
        }
        
    for card in cards_it:
        cid = str(card['id'])
        if cid in card_map:
            card_map[cid]['name_it'] = card['name']
            
    # Hashing Pipeline (Skipped if ENABLE_HASHING is False)
    if not os.path.exists(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)
        
    if not os.path.exists(os.path.dirname(DB_FILE)):
        os.makedirs(os.path.dirname(DB_FILE))

    print(f"Saving Database with {len(card_map)} cards...")
    with open(DB_FILE, 'wb') as f:
        pickle.dump(card_map, f)
        
    print("Database updated successfully!")

if __name__ == "__main__":
    download_and_hash()
