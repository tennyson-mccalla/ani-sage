/**
 * API Question Bank
 *
 * This module re-exports the question bank from the app/lib directory.
 */

import { questions as questionLibrary } from '@/app/lib/question-bank';

export const questions = questionLibrary;
