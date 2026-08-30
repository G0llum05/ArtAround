import { Component, input, output, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupSocketService } from '../../services/group-socket.service';
import { Quiz, QuizSubmissionAnswer, QuizResult } from '../../models/quiz.model';

@Component({
  selector: 'app-quiz-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-modal.html',
  styleUrl: './quiz-modal.css'
})
export class QuizModal implements OnInit, OnDestroy {
  protected socketService = inject(GroupSocketService);
  private router = inject(Router);

  isTeacher = input<boolean>(false);
  sessionCode = input.required<string>();
  quiz = input<Quiz | null>(null);
  totalStudents = input<number>(0);

  closeModal = output<void>();

  selectedAnswers = signal<{ [key: number]: number }>({});
  isSubmitting = signal<boolean>(false);
  hasSubmitted = signal<boolean>(false);
  myResult = signal<QuizResult | null>(null);

  studentSubmissions = signal<Array<{
    studentId: string;
    studentName: string;
    studentSurname?: string;
    studentEmail?: string;
    score: number;
    totalQuestions: number;
    percentage: number;
  }>>([]);

  finalResults = signal<any | null>(null);
  quizCompleted = signal<boolean>(false);

  allAnswered = computed(() => {
    const q = this.quiz();
    if (!q || !q.questions || q.questions.length === 0) return false;
    const selected = this.selectedAnswers();
    return q.questions.every((_, idx) => selected[idx] !== undefined);
  });

  answeredCount = computed(() => {
    return Object.keys(this.selectedAnswers()).length;
  });

  private unregisterStudentSubmitted: (() => void) | null = null;
  private unregisterQuizEnded: (() => void) | null = null;

  ngOnInit(): void {
    this.unregisterStudentSubmitted = this.socketService.onQuizStudentSubmitted((data) => {
      this.studentSubmissions.update(list => {
        const filtered = list.filter(s => s.studentId !== data.studentId);
        return [...filtered, data];
      });
    });

    this.unregisterQuizEnded = this.socketService.onQuizEnded((data) => {
      this.finalResults.set(data);
      this.quizCompleted.set(true);
    });
  }

  ngOnDestroy(): void {
    if (this.unregisterStudentSubmitted) this.unregisterStudentSubmitted();
    if (this.unregisterQuizEnded) this.unregisterQuizEnded();
  }

  selectOption(questionIndex: number, optionIndex: number): void {
    if (this.hasSubmitted() || this.quizCompleted()) return;
    this.selectedAnswers.update(curr => ({
      ...curr,
      [questionIndex]: optionIndex
    }));
  }

  submitAnswers(): void {
    if (!this.allAnswered() || this.isSubmitting() || this.hasSubmitted()) return;

    const q = this.quiz();
    if (!q) return;

    this.isSubmitting.set(true);
    const answersArray: QuizSubmissionAnswer[] = (q.questions || []).map((_, idx) => ({
      questionIndex: idx,
      selectedOption: this.selectedAnswers()[idx] ?? 0
    }));

    this.socketService.submitQuiz(this.sessionCode(), answersArray)
      .then((res: any) => {
        this.isSubmitting.set(false);
        this.hasSubmitted.set(true);
        this.myResult.set(res);
      })
      .catch((err) => {
        this.isSubmitting.set(false);
        console.error('[QuizModal] Errore invio risposte:', err);
      });
  }

  endQuiz(): void {
    this.socketService.endQuiz(this.sessionCode())
      .catch(err => console.error('[QuizModal] Errore conclusione quiz:', err));
  }

  endVisitAndClose(): void {
    if (this.isTeacher()) {
      this.socketService.endSession(this.sessionCode(), '')
        .finally(() => {
          this.socketService.disconnect();
          this.closeModal.emit();
          this.router.navigate(['/']);
        });
    } else {
      this.socketService.disconnect();
      this.closeModal.emit();
      this.router.navigate(['/']);
    }
  }

  close(): void {
    if (this.isTeacher()) {
      this.socketService.endSession(this.sessionCode(), '')
        .finally(() => {
          this.socketService.disconnect();
          this.closeModal.emit();
          this.router.navigate(['/']);
        });
    } else {
      this.socketService.disconnect();
      this.closeModal.emit();
      this.router.navigate(['/']);
    }
  }
}
