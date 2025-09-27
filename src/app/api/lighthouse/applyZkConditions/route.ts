// api/lighthouse/applyZkConditions/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const POST = async (req: NextRequest) => {
    try {
        const { cid, address, signature, conditions } = await req.json();

        if (!cid || !address || !signature || !conditions) {
            return NextResponse.json({
                error: "Missing required fields: cid, address, signature, conditions"
            }, { status: 400 });
        }

        // Validate conditions format
        if (!Array.isArray(conditions) || conditions.length === 0) {
            return NextResponse.json({
                error: "Conditions must be a non-empty array"
            }, { status: 400 });
        }

        const nodeId = [1, 2, 3, 4, 5];
        const nodeUrls = nodeId.map(
            (elem) => `https://encryption.lighthouse.storage/api/setZkConditions/${elem}`
        );

        const config = {
            method: "post",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${signature}`,
            },
        };

        const apidata = {
            address: address,
            cid: cid,
            conditions: conditions,
        };

        const requestData = async (url: string) => {
            try {
                return await axios({
                    url,
                    data: apidata,
                    ...config,
                });
            } catch (error: unknown) {
                console.error(`Error with node ${url}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const responseData = (error as { response?: { data?: unknown } })?.response?.data;
                return {
                    isSuccess: false,
                    error: responseData || errorMessage,
                };
            }
        };

        // Apply conditions to all nodes
        const results = [];
        for (const [index, url] of nodeUrls.entries()) {
            const response = await requestData(url);
            results.push({
                nodeId: nodeId[index],
                success: 'isSuccess' in response ? response.isSuccess !== false : true,
                data: 'data' in response ? response.data : ('error' in response ? response.error : null)
            });
        }

        // Check if majority of nodes succeeded
        const successCount = results.filter(r => r.success).length;
        const isOverallSuccess = successCount >= Math.ceil(nodeId.length / 2);

        return NextResponse.json({
            success: isOverallSuccess,
            cid,
            conditions,
            results,
            message: isOverallSuccess
                ? "zkTLS conditions applied successfully"
                : "Failed to apply conditions to majority of nodes"
        });

    } catch (err: unknown) {
        console.error("Apply zkTLS conditions error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to apply zkTLS conditions";
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
};