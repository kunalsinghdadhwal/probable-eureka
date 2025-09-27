export const VERIFICATION_EXPIRY_DAYS = 30;
export const MAX_ACCURACY = 10000; // 100% = 10000
export const MIN_DATASET_SIZE = 100;
export const MAX_AGENT_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const DEFAULT_MAX_SUPPLY = 100;

export const AGENT_TYPES = [
    'transformer',
    'cnn',
    'rnn',
    'gan',
    'diffusion',
    'reinforcement',
    'other'
] as const;

export type AgentType = typeof AGENT_TYPES[number];