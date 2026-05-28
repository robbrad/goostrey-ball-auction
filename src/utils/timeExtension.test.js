import { describe, it, expect } from 'vitest';
import { computeExtendedTime } from './timeExtension.js';

describe('computeExtendedTime', () => {
  it('adds 5 minutes to the given end time', () => {
    const endTime = new Date('2024-06-15T18:00:00.000Z');
    const result = computeExtendedTime(endTime, 5);
    expect(result.getTime()).toBe(endTime.getTime() + 5 * 60 * 1000);
  });

  it('adds 15 minutes to the given end time', () => {
    const endTime = new Date('2024-06-15T18:00:00.000Z');
    const result = computeExtendedTime(endTime, 15);
    expect(result.getTime()).toBe(endTime.getTime() + 15 * 60 * 1000);
  });

  it('adds 30 minutes to the given end time', () => {
    const endTime = new Date('2024-06-15T18:00:00.000Z');
    const result = computeExtendedTime(endTime, 30);
    expect(result.getTime()).toBe(endTime.getTime() + 30 * 60 * 1000);
  });

  it('returns a new Date object without mutating the original', () => {
    const endTime = new Date('2024-06-15T18:00:00.000Z');
    const originalTime = endTime.getTime();
    const result = computeExtendedTime(endTime, 5);
    expect(endTime.getTime()).toBe(originalTime);
    expect(result).not.toBe(endTime);
  });
});
