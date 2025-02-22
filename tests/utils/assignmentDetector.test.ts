import { AssignmentDetector } from '../../src/utils/assignmentDetector';
import { Assignment } from '../../src/types/models';
import fetchMock from 'jest-fetch-mock';

describe('AssignmentDetector', () => {
    let detector: AssignmentDetector;

    beforeEach(() => {
        detector = new AssignmentDetector();
        fetchMock.resetMocks();
    });

    describe('detectAssignments', () => {
        it('should combine assignments from all sources', async () => {
            // Mock API responses
            fetchMock
                .mockResponseOnce(JSON.stringify([
                    {
                        plannable_id: '1',
                        plannable_type: 'assignment',
                        plannable_date: '2024-01-20',
                        plannable: {
                            title: 'Test Assignment',
                            points_possible: 100
                        },
                        context_name: 'Test Course'
                    }
                ]))
                .mockResponseOnce(JSON.stringify([
                    {
                        id: '2',
                        name: 'Missing Quiz',
                        due_at: '2024-01-21',
                        points_possible: 50,
                        course: { name: 'Test Course 2' }
                    }
                ]))
                .mockResponseOnce(JSON.stringify([
                    {
                        assignments: [{
                            id: '3',
                            name: 'Dashboard Assignment',
                            due_at: '2024-01-22',
                            points_possible: 75
                        }],
                        shortName: 'Test Course 3'
                    }
                ]));

            const assignments = await detector.detectAssignments();

            expect(assignments).toHaveLength(3);
            expect(assignments).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    id: '1',
                    title: 'Test Assignment',
                    type: 'assignment'
                }),
                expect.objectContaining({
                    id: '2',
                    title: 'Missing Quiz',
                    type: 'assignment'
                }),
                expect.objectContaining({
                    id: '3',
                    title: 'Dashboard Assignment',
                    type: 'assignment'
                })
            ]));
        });

        it('should handle different assignment types correctly', async () => {
            fetchMock
                .mockResponseOnce(JSON.stringify([
                    {
                        plannable_id: '1',
                        plannable_type: 'quiz',
                        plannable_date: '2024-01-20',
                        plannable: { title: 'Test Quiz' },
                        context_name: 'Test Course'
                    },
                    {
                        plannable_id: '2',
                        plannable_type: 'discussion_topic',
                        plannable_date: '2024-01-21',
                        plannable: { title: 'Test Discussion' },
                        context_name: 'Test Course'
                    }
                ]))
                .mockResponseOnce(JSON.stringify([]))
                .mockResponseOnce(JSON.stringify([]));

            const assignments = await detector.detectAssignments();

            expect(assignments).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    id: '1',
                    type: 'quiz',
                    title: 'Test Quiz'
                }),
                expect.objectContaining({
                    id: '2',
                    type: 'discussion',
                    title: 'Test Discussion'
                })
            ]));
        });

        it('should filter out invalid assignments', async () => {
            fetchMock
                .mockResponseOnce(JSON.stringify([
                    {
                        plannable_id: '1',
                        plannable_type: 'assignment',
                        // Missing due date
                        plannable: { title: 'Invalid Assignment' },
                        context_name: 'Test Course'
                    }
                ]))
                .mockResponseOnce(JSON.stringify([]))
                .mockResponseOnce(JSON.stringify([]));

            const assignments = await detector.detectAssignments();
            expect(assignments).toHaveLength(0);
        });

        it('should handle API errors gracefully', async () => {
            fetchMock
                .mockRejectOnce(new Error('Network error'))
                .mockResponseOnce(JSON.stringify([]))
                .mockResponseOnce(JSON.stringify([]));

            const assignments = await detector.detectAssignments();
            expect(assignments).toHaveLength(0);
        });
    });
});