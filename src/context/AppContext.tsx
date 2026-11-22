import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  ANDHRA_SCHEMES,
  EMPTY_PROFILE,
  checkAllSchemes,
} from '../engine/eligibilityEngine';
import { UI_COPY } from '../i18n/strings';
import {
  AndhraScheme,
  ChatMessage,
  EligibilityCheckResult,
  LanguageCode,
  PhoneReminder,
  WelfareProfile,
} from '../types/scheme';

const REMINDERS_STORAGE_KEY = 'cwy_phone_reminders_v1';

interface AppState {
  language: LanguageCode;
  // Session-only profile & chat — NEVER written to localStorage or sessionStorage (Step 2)
  profile: WelfareProfile;
  messages: ChatMessage[];
  // Optional phone-number reminders (Step 5)
  reminders: PhoneReminder[];
}

function buildWelcomeMessage(lang: LanguageCode): ChatMessage {
  const c = UI_COPY[lang];
  return {
    id: 'welcome',
    role: 'assistant',
    text: `${c.heroGreeting}\n${c.whoForPrompt}`,
    timestamp: new Date().toISOString(),
  };
}

function loadRemindersOnly(): PhoneReminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createInitialState(): AppState {
  // Cleanup any legacy profile storage key from previous version
  try {
    localStorage.removeItem('claim_whats_yours_state_v1');
  } catch {
    // ignore
  }
  return {
    language: 'te', // Telugu first (Step 1)
    profile: { ...EMPTY_PROFILE },
    messages: [buildWelcomeMessage('te')],
    reminders: loadRemindersOnly(),
  };
}

type Action =
  | { type: 'SET_LANGUAGE'; language: LanguageCode }
  | { type: 'UPDATE_PROFILE'; partial: Partial<WelfareProfile> }
  | { type: 'SET_PROFILE'; profile: WelfareProfile }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'RESET_SESSION' }
  | { type: 'ADD_REMINDER'; reminder: PhoneReminder }
  | { type: 'DELETE_REMINDER'; id: string }
  | { type: 'DELETE_ALL_DATA' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LANGUAGE': {
      const updatedMessages =
        state.messages.length === 1 && state.messages[0].id === 'welcome'
          ? [buildWelcomeMessage(action.language)]
          : state.messages;
      return {
        ...state,
        language: action.language,
        messages: updatedMessages,
      };
    }
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: { ...state.profile, ...action.partial },
      };
    case 'SET_PROFILE':
      return {
        ...state,
        profile: action.profile,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
    case 'RESET_SESSION':
      return {
        ...state,
        profile: { ...EMPTY_PROFILE },
        messages: [buildWelcomeMessage(state.language)],
      };
    case 'ADD_REMINDER':
      return {
        ...state,
        reminders: [action.reminder, ...state.reminders],
      };
    case 'DELETE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.filter((r) => r.id !== action.id),
      };
    case 'DELETE_ALL_DATA':
      try {
        localStorage.removeItem(REMINDERS_STORAGE_KEY);
      } catch {
        // ignore
      }
      return {
        ...state,
        profile: { ...EMPTY_PROFILE },
        messages: [buildWelcomeMessage(state.language)],
        reminders: [],
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  schemes: AndhraScheme[];
  results: EligibilityCheckResult[];
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // Persist ONLY opt-in reminders (never the session profile or chat!)
  useEffect(() => {
    try {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(state.reminders));
    } catch {
      // ignore
    }
  }, [state.reminders]);

  const results = useMemo(() => checkAllSchemes(state.profile), [state.profile]);

  return (
    <AppContext.Provider
      value={{ state, schemes: ANDHRA_SCHEMES, results, dispatch }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return ctx;
}
