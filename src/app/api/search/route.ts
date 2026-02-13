import { NextRequest, NextResponse } from 'next/server';

// THE PYTHON SERVER IP
// Yugioh uses the stable remote server containing the full DB
const YUGIOH_API_URL = "http://206.189.50.215:8000";
// Pokemon uses the local server where we implemented caching
const POKEMON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        if (!q) {
            return NextResponse.json({ results: [] });
        }

        const gameType = searchParams.get('gameType') || 'Yugioh';
        console.log(`[API] Searching for "${q}" in ${gameType}`);

        // 1. POKEMON TCG - Using Python server
        if (gameType === 'Pokemon') {
            try {
                console.log(`[API] Searching Pokemon via Python server: "${q}"`);

                const pokeRes = await fetch(`${POKEMON_API_URL}/pokemon/search?q=${encodeURIComponent(q)}`);

                if (!pokeRes.ok) {
                    console.error(`[API] Pokemon server error: ${pokeRes.status}`);
                    return NextResponse.json({ error: "Pokemon Server Error" }, { status: pokeRes.status });
                }

                const pokeData = await pokeRes.json();
                console.log(`[API] Pokemon found ${pokeData.results?.length || 0} cards`);

                return NextResponse.json(pokeData);
            } catch (error: any) {
                console.error('[API] Pokemon fetch error:', error.message);
                return NextResponse.json({ results: [], error: error.message });
            }
        }

        // 2. MAGIC THE GATHERING - Using Python server (Scryfall)
        if (gameType === 'Magic' || gameType === 'Magic: The Gathering') {
            try {
                console.log(`[API] Searching Magic via Python server: "${q}"`);
                // Magic uses the same local server as Pokemon for now
                const magicRes = await fetch(`${POKEMON_API_URL}/magic/search?q=${encodeURIComponent(q)}`);

                if (!magicRes.ok) {
                    console.error(`[API] Magic server error: ${magicRes.status}`);
                    return NextResponse.json({ error: "Magic Server Error" }, { status: magicRes.status });
                }

                const magicData = await magicRes.json();
                console.log(`[API] Magic found ${magicData.results?.length || 0} cards`);
                return NextResponse.json(magicData);
            } catch (error: any) {
                console.error('[API] Magic fetch error:', error.message);
                return NextResponse.json({ results: [], error: error.message });
            }
        }

        // 3. ONE PIECE - Using Python server
        if (gameType === 'OnePiece' || gameType === 'One Piece') {
            try {
                console.log(`[API] Searching One Piece via Python server: "${q}"`);
                const opRes = await fetch(`${POKEMON_API_URL}/onepiece/search?q=${encodeURIComponent(q)}`);

                if (!opRes.ok) {
                    console.error(`[API] One Piece server error: ${opRes.status}`);
                    return NextResponse.json({ error: "One Piece Server Error" }, { status: opRes.status });
                }

                const opData = await opRes.json();
                console.log(`[API] One Piece found ${opData.results?.length || 0} cards`);
                return NextResponse.json(opData);
            } catch (error: any) {
                console.error('[API] One Piece fetch error:', error.message);
                return NextResponse.json({ results: [], error: error.message });
            }
        }

        // 4. YUGIOH - Using Python server
        const yugiohRes = await fetch(`${YUGIOH_API_URL}/search?q=${encodeURIComponent(q)}`);

        if (!yugiohRes.ok) {
            return NextResponse.json({ error: "Search server error" }, { status: yugiohRes.status });
        }

        const data = await yugiohRes.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Search Proxy Error:", error);
        return NextResponse.json({ error: "Internal Proxy Error" }, { status: 500 });
    }
}
