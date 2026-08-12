export interface ItineraryStep {
  id: string;
  title: string;
  room: string;
  floor: string;
  duration: string;
  completed: boolean;
  isCurrent: boolean;
}
