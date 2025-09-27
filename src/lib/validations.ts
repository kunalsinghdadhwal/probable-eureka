import { z } from 'zod';
import { AGENT_TYPES, MAX_ACCURACY, MIN_DATASET_SIZE } from './constants';

export const zkTLSProofSchema = z.object({
    identifier: z.string().min(1, 'Identifier is required'),
    claimData: z.object({
        provider: z.string().min(1, 'Provider is required'),
        parameters: z.string(),
        owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
        timestampS: z.number().positive('Invalid timestamp'),
        context: z.string(),
        contextAddress: z.string(),
        contextMessage: z.string(),
        epoch: z.number().nonnegative()
    }),
    signatures: z.array(z.object({
        signature: z.string().min(1),
        identifier: z.string().min(1)
    })).min(1, 'At least one signature required'),
    witnesses: z.array(z.object({
        id: z.string().min(1),
        url: z.string().url('Invalid witness URL')
    })).min(1, 'At least one witness required')
});

export const agentParamsSchema = z.object({
    name: z.string()
        .min(1, 'Agent name is required')
        .max(100, 'Agent name too long'),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description too long'),
    lighthouseHash: z.string()
        .min(1, 'Lighthouse hash is required')
        .regex(/^bafkrei[a-zA-Z0-9]+$/, 'Invalid Lighthouse hash format'),
    agentType: z.enum(AGENT_TYPES, {
        errorMap: () => ({ message: 'Invalid agent type' })
    }),
    datasetSize: z.number()
        .int('Dataset size must be an integer')
        .min(MIN_DATASET_SIZE, `Dataset size must be at least ${MIN_DATASET_SIZE}`)
        .max(1000000000, 'Dataset size too large'),
    trainingEpochs: z.number()
        .int('Training epochs must be an integer')
        .min(1, 'Training epochs must be at least 1')
        .max(10000, 'Training epochs too high'),
    accuracy: z.number()
        .min(0, 'Accuracy cannot be negative')
        .max(MAX_ACCURACY, 'Accuracy cannot exceed 100%'),
    maxSupply: z.number()
        .int('Max supply must be an integer')
        .min(1, 'Max supply must be at least 1')
        .max(1000000, 'Max supply too high'),
    mintPrice: z.string()
        .regex(/^\d+$/, 'Invalid mint price format'),
    allowPublicMint: z.boolean()
});

export const verificationRequestSchema = z.object({
    creatorAddress: z.string()
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid creator address'),
    lighthouseHash: z.string()
        .min(1, 'Lighthouse hash is required'),
    zkTLSProof: zkTLSProofSchema
});