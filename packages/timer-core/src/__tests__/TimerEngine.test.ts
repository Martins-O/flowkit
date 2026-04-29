import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimerEngine } from '../TimerEngine.js';

describe('TimerEngine', () => {
  let engine: TimerEngine;

  beforeEach(() => {
    engine = new TimerEngine({
      focusDuration: 10,
      shortBreakDuration: 5,
      longBreakDuration: 8,
      sessionsUntilLongBreak: 4,
      autoStartBreaks: false,
      autoStartFocus: false,
      allowOverflow: false,
    });
  });

  it('starts in idle state', () => {
    const state = engine.getState();
    expect(state.status).toBe('idle');
    expect(state.type).toBe('focus');
    expect(state.elapsed).toBe(0);
    expect(state.remaining).toBe(10);
  });

  it('transitions to running on start()', () => {
    engine.start('task-1');
    expect(engine.getState().status).toBe('running');
    expect(engine.getState().currentTaskId).toBe('task-1');
  });

  it('pauses and resumes correctly', () => {
    engine.start();
    engine.pause();
    expect(engine.getState().status).toBe('paused');
    engine.resume();
    expect(engine.getState().status).toBe('running');
  });

  it('ticks elapsed time correctly', () => {
    engine.start();
    engine.tick();
    engine.tick();
    expect(engine.getState().elapsed).toBe(2);
    expect(engine.getState().remaining).toBe(8);
  });

  it('completes session after full duration', () => {
    engine.start();
    for (let i = 0; i < 10; i++) engine.tick();
    const state = engine.getState();
    expect(state.type).toBe('short_break');
    expect(state.sessionCount).toBe(1);
  });

  it('fires onSessionEnd callback when focus completes', () => {
    const cb = vi.fn();
    engine.onSessionEnd(cb);
    engine.start();
    for (let i = 0; i < 10; i++) engine.tick();
    expect(cb).toHaveBeenCalledOnce();
    expect(cb.mock.calls[0]?.[0].type).toBe('focus');
  });

  it('transitions to long break after sessionsUntilLongBreak', () => {
    const shortEngine = new TimerEngine({
      focusDuration: 1,
      shortBreakDuration: 1,
      longBreakDuration: 1,
      sessionsUntilLongBreak: 2,
      autoStartBreaks: true,
      autoStartFocus: true,
      allowOverflow: false,
    });

    shortEngine.start();
    shortEngine.tick(); // focus ends → short_break (session 1)
    shortEngine.tick(); // short_break ends → focus (auto)
    shortEngine.tick(); // focus ends → long_break (session 2)

    expect(shortEngine.getState().type).toBe('long_break');
  });

  it('stops and resets to initial state', () => {
    engine.start();
    engine.tick();
    engine.stop();
    const state = engine.getState();
    expect(state.status).toBe('idle');
    expect(state.elapsed).toBe(0);
    expect(state.remaining).toBe(10);
  });

  it('does not tick when paused', () => {
    engine.start();
    engine.pause();
    engine.tick();
    expect(engine.getState().elapsed).toBe(0);
  });

  it('unsubscribes onTick correctly', () => {
    const cb = vi.fn();
    const unsub = engine.onTick(cb);
    engine.start();
    engine.tick();
    expect(cb).toHaveBeenCalledOnce();
    unsub();
    engine.tick();
    expect(cb).toHaveBeenCalledOnce();
  });
});
