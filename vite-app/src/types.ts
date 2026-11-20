
export type AccessibilityStatus = 'full' | 'partial' | 'none' | 'unknown';

export interface Place {
    id: number;
    name: string;
    address: string;
    accessibility: AccessibilityStatus;
    accessibilityLabel: string;
    hours: string;
    image: string;
    description: string;
    hasRamp: boolean;
    hasElevator: boolean;
    hasAccessibleToilet: boolean;
    lat?: number;
    lng?: number;
}

export interface AppState {
    places: Place[];
    search: string;
    accessibility: string;
}