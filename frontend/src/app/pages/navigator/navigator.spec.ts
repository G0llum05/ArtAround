import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { Navigator } from './navigator';
import { NavigatorRequest } from '../../models/navigator.model';
import { NavigatorService, StreamChunk } from '../../services/navigator.service';
import { VisitService } from '../../services/visit.service';
import { GroupSocketService } from '../../services/group-socket.service';

describe('Navigator', () => {
  let component: Navigator;
  let fixture: ComponentFixture<Navigator>;
  let navigatorService: NavigatorService;

  beforeEach(async () => {
    const navigatorServiceMock: Partial<NavigatorService> = {
      sendCommand: async () => {}
    };
    const visitServiceMock: Partial<VisitService> = {
      getById: () => of({} as any)
    };
    const groupSocketServiceMock: Partial<GroupSocketService> = {
      studentsAudioSummary: signal(null),
      connect: async () => {},
      onStepChanged: () => () => {},
      onSessionEnded: () => () => {},
      sendAudioStatus: () => {},
      changeStep: async () => ({})
    };

    await TestBed.configureTestingModule({
      imports: [Navigator],
      providers: [
        { provide: NavigatorService, useValue: navigatorServiceMock },
        { provide: VisitService, useValue: visitServiceMock },
        { provide: GroupSocketService, useValue: groupSocketServiceMock },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Router, useValue: { navigate: vi.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Navigator);
    component = fixture.componentInstance;
    navigatorService = TestBed.inject(NavigatorService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update itinerary step from streamed final response index', async () => {
    const sendCommandSpy = vi.spyOn(navigatorService, 'sendCommand').mockImplementation(
      async (
        _request: NavigatorRequest,
        _audioBlob?: Blob,
        onChunk?: (chunk: StreamChunk) => void
      ): Promise<void> => {
        onChunk?.({
          type: 'FINAL_RESPONSE',
          success: true,
          data: {
            text: 'Passiamo alla prossima opera.',
            currentArtworkIndex: 1
          }
        });
      }
    );

    component.currentItineraryStepIndex.set(0);
    await component.executeCommand({}, new Blob(['audio'], { type: 'audio/webm' }));

    expect(sendCommandSpy).toHaveBeenCalled();
    expect(component.currentItineraryStepIndex()).toBe(1);
  });
});
