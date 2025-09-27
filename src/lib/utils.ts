import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ethers } from 'ethers';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (!address || address.length < 42) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokenId(tokenId: string | number): string {
  return `#${tokenId.toString().padStart(4, '0')}`;
}

export function formatAccuracy(accuracy: number): string {
  return `${(accuracy / 100).toFixed(2)}%`;
}

export function formatEther(wei: string | number): string {
  try {
    return `${ethers.formatEther(wei.toString())} ETH`;
  } catch {
    return '0 ETH';
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidLighthouseHash(hash: string): boolean {
  return /^bafkrei[a-zA-Z0-9]+$/.test(hash);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function timeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

export function timeUntilExpiry(verificationTime: number, expiryDurationSeconds: number): string {
  const expiryTime = verificationTime + expiryDurationSeconds;
  const now = Date.now() / 1000;
  const remaining = expiryTime - now;

  if (remaining <= 0) return 'Expired';

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return `${Math.floor(remaining / 60)}m remaining`;
}