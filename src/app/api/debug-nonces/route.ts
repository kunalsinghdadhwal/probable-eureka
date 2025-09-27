import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // This is a debug endpoint
        return NextResponse.json({
            message: 'Debug nonces endpoint',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Debug nonces error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
