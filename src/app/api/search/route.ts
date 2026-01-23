import { NextRequest, NextResponse } from 'next/server';

// THE PYTHON SERVER IP
const PYTHON_API_URL = "http://206.189.50.215:8000/search";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        if (!q) {
            return NextResponse.json({ results: [] });
        }

        // Forward to Python Server
        const response = await fetch(`${PYTHON_API_URL}?q=${encodeURIComponent(q)}`);

        if (!response.ok) {
            return NextResponse.json({ error: "Search server error" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Search Proxy Error:", error);
        return NextResponse.json({ error: "Internal Proxy Error" }, { status: 500 });
    }
}
