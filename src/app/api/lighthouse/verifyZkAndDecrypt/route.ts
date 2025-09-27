import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
    try {
        const { cid, address, signature, proof } = await req.json()

        if (!cid || !address || !signature || !proof) {
            return NextResponse.json({
                error: 'Missing required fields: cid, address, signature, proof'
            }, { status: 400 })
        }

        // Validate proof format
        if (typeof proof !== 'object' || !proof) {
            return NextResponse.json({
                error: 'Proof must be a valid object'
            }, { status: 400 })
        }

        const nodeId = [1, 2, 3, 4, 5]
        const nodeUrls = nodeId.map(
            (elem) => `https://encryption.lighthouse.storage/api/verifyZkAndDecrypt/${elem}`
        )

        const config = {
            method: 'post',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${signature}`,
            },
        }

        const apidata = {
            address: address,
            cid: cid,
            proof: proof,
        }

        const requestData = async (url: string) => {
            try {
                return await axios({
                    url,
                    data: apidata,
                    ...config,
                })
            } catch (error: unknown) {
                console.error(`Error with node ${url}:`, error)
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                const responseData = (error as { response?: { data?: unknown } })?.response?.data
                return {
                    isSuccess: false,
                    error: responseData || errorMessage,
                }
            }
        }

        // Try to verify and decrypt from nodes
        const results = []
        let decryptedData = null

        for (const [index, url] of nodeUrls.entries()) {
            const response = await requestData(url)
            const isSuccess = 'isSuccess' in response ? response.isSuccess !== false : true

            results.push({
                nodeId: nodeId[index],
                success: isSuccess,
                data: 'data' in response ? response.data : ('error' in response ? response.error : null)
            })

            // If we got successful decryption, store the data
            if (isSuccess && 'data' in response && response.data && !decryptedData) {
                decryptedData = response.data
            }
        }

        // Check if we successfully got decrypted data
        const successCount = results.filter(r => r.success).length
        const isOverallSuccess = successCount > 0 && decryptedData

        return NextResponse.json({
            success: isOverallSuccess,
            cid,
            decryptedData: isOverallSuccess ? decryptedData : null,
            results,
            message: isOverallSuccess
                ? 'zkTLS proof verified and file decrypted successfully'
                : 'Failed to verify proof or decrypt file'
        })

    } catch (error: unknown) {
        console.error('Verify ZK and decrypt error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to verify proof and decrypt file'
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 })
    }
}
