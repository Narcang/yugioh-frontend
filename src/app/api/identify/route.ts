import { NextRequest, NextResponse } from 'next/server';

// THE PYTHON SERVER IP
const PYTHON_API_URL = "http://206.189.50.215:8000/identify";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Create a new FormData to send to the Python server
        const backendFormData = new FormData();
        backendFormData.append('file', file);

        // Forward the request to the Python server
        const response = await fetch(PYTHON_API_URL, {
            method: 'POST',
            body: backendFormData,
        });

        if (!response.ok) {
            console.error("Python Server Error:", response.status, response.statusText);
            return NextResponse.json({ error: "Recognition server error" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: "Internal Proxy Error" }, { status: 500 });
    }
}
