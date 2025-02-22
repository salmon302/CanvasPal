import { Assignment, AssignmentType, AssignmentDetails } from '../types/models';
import { Logger } from '../utils/logger';
import { DebugPanel } from './debugPanel';
import { DateDebugger } from './dateDebugger';
import { PerformanceMonitor } from './performanceMonitor';

export class AssignmentDetector {
    private logger: Logger;
    private debugPanel: DebugPanel;
    private dateDebugger: DateDebugger;
    private performanceMonitor: PerformanceMonitor;

    constructor() {
        this.logger = new Logger('AssignmentDetector');
        this.debugPanel = new DebugPanel();
        this.dateDebugger = new DateDebugger();
        this.performanceMonitor = PerformanceMonitor.getInstance();
    }

    public async detectAssignments(): Promise<Assignment[]> {
        return this.performanceMonitor.monitorAsync('detectAssignments', async () => {
            try {
                this.debugPanel.logDetectionEvent('Starting assignment detection');
                
                // Monitor date detection
                const dateMatches = await this.performanceMonitor.monitorAsync('dateDetection', 
                    async () => this.dateDebugger.highlightDates(),
                    { totalElements: document.querySelectorAll('[class*="date"]').length }
                );

                this.debugPanel.logDetectionEvent('Date detection complete', {
                    totalDates: dateMatches.length,
                    dueDates: dateMatches.filter(m => m.type === 'due').length,
                    performance: this.performanceMonitor.getReport()
                });

                // Monitor API fetches in parallel
                const [plannerItems, missingSubmissions, dashboardItems] = await Promise.all([
                    this.performanceMonitor.monitorAsync('fetchPlannerItems', 
                        () => this.fetchPlannerItems()),
                    this.performanceMonitor.monitorAsync('fetchMissingSubmissions', 
                        () => this.fetchMissingSubmissions()),
                    this.performanceMonitor.monitorAsync('parseDashboardCards', 
                        () => this.parseDashboardCards())
                ]);

                const allAssignments = [...plannerItems, ...missingSubmissions, ...dashboardItems]
                    .filter(assignment => this.isValidAssignment(assignment));

                // Monitor date validation
                await this.performanceMonitor.monitorAsync('validateDates', 
                    async () => this.validateAssignmentDates(allAssignments, dateMatches),
                    { assignmentCount: allAssignments.length }
                );

                const performanceReport = this.performanceMonitor.getReport();
                this.debugPanel.logDetectionEvent('Assignment detection complete', {
                    totalAssignments: allAssignments.length,
                    performance: performanceReport
                });

                return allAssignments;
            } catch (error) {
                this.logger.error('Error detecting assignments:', error);
                return [];
            }
        });
    }

    private async validateAssignmentDates(assignments: Assignment[], dateMatches: any[]): Promise<void> {
        return this.performanceMonitor.monitorAsync('validateAssignmentDates', async () => {
            assignments.forEach(assignment => {
                const matchingDateElements = dateMatches.filter(match => {
                    const matchDate = match.date.getTime();
                    const assignmentDate = assignment.dueDate.getTime();
                    return Math.abs(matchDate - assignmentDate) < 24 * 60 * 60 * 1000;
                });

                if (matchingDateElements.length > 0) {
                    this.debugPanel.logDetectionEvent('Date validation:', {
                        assignment: assignment.title,
                        dueDate: assignment.dueDate,
                        matchingElements: matchingDateElements.length
                    });
                }
            });
        }, { assignmentCount: assignments.length, dateMatchCount: dateMatches.length });
    }

    private async fetchPlannerItems(): Promise<Assignment[]> {
        try {
            const response = await fetch('/api/v1/planner/items?per_page=50', {
                headers: {
                    'Accept': 'application/json+canvas-string-ids, application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const items = await response.json();
            this.debugPanel.logDetectionEvent('Planner items retrieved:', items);

            return items.map((item: any) => {
                const assignment = this.convertPlannerItem(item);
                if (assignment) {
                    this.debugPanel.logDetectionEvent('Processed planner item:', {
                        title: assignment.title,
                        type: assignment.type,
                        dueDate: assignment.dueDate
                    });
                }
                return assignment;
            }).filter((item: Assignment | null): item is Assignment => item !== null);
        } catch (error) {
            this.logger.error('Error fetching planner items:', error);
            return [];
        }
    }

    private async fetchMissingSubmissions(): Promise<Assignment[]> {
        try {
            const response = await fetch('/api/v1/users/self/missing_submissions?include[]=planner_overrides', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const submissions = await response.json();
            return submissions.map((submission: any) => this.convertMissingSubmission(submission))
                .filter((item: Assignment | null) => item !== null) as Assignment[];
        } catch (error) {
            this.logger.error('Error fetching missing submissions:', error);
            return [];
        }
    }

    private async parseDashboardCards(): Promise<Assignment[]> {
        try {
            const response = await fetch('/api/v1/dashboard/dashboard_cards', {
                headers: {
                    'Accept': 'application/json+canvas-string-ids, application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const cards = await response.json();
            this.debugPanel.logDetectionEvent('Dashboard cards retrieved:', cards);

            const assignments: Assignment[] = [];
            for (const card of cards) {
                if (card.assignments) {
                    const processed = card.assignments
                        .map((assignment: any) => {
                            const converted = this.convertDashboardAssignment(assignment, card);
                            if (converted) {
                                this.debugPanel.logDetectionEvent('Processed dashboard assignment:', {
                                    title: converted.title,
                                    type: converted.type,
                                    course: converted.course
                                });
                            }
                            return converted;
                        })
                        .filter((item: Assignment | null): item is Assignment => item !== null);
                    assignments.push(...processed);
                }
            }

            return assignments;
        } catch (error) {
            this.logger.error('Error parsing dashboard cards:', error);
            return [];
        }
    }

    private convertPlannerItem(item: any): Assignment | null {
        if (!item.plannable || !item.plannable_type) return null;

        const type = this.determineAssignmentType(item.plannable_type);
        const dueDate = item.plannable_date ? new Date(item.plannable_date) : null;

        if (!type || !dueDate) return null;

        return {
            id: item.plannable_id.toString(),
            title: item.plannable?.title || item.plannable?.name || '',
            dueDate,
            course: item.context_name || '',
            courseId: item.course_id?.toString(),
            type,
            points: item.plannable?.points_possible,
            maxPoints: item.plannable?.points_possible,
            completed: !!item.planner_override?.marked_complete,
            priorityScore: 0, // Will be calculated later
            url: item.html_url,
            details: {
                submissionType: item.plannable?.submission_types,
                isCompleted: !!item.planner_override?.marked_complete,
                isLocked: !!item.plannable?.locked_for_user,
                description: item.plannable?.description
            }
        };
    }

    private convertMissingSubmission(submission: any): Assignment | null {
        if (!submission.due_at) return null;

        return {
            id: submission.id.toString(),
            title: submission.name || submission.assignment?.name || '',
            dueDate: new Date(submission.due_at),
            course: submission.course?.name || '',
            courseId: submission.course_id?.toString(),
            type: 'assignment',
            points: submission.points_possible,
            maxPoints: submission.points_possible,
            completed: false,
            priorityScore: 0,
            url: submission.html_url,
            details: {
                isCompleted: false,
                isLocked: false
            }
        };
    }

    private convertDashboardAssignment(assignment: any, card: any): Assignment | null {
        if (!assignment.due_at) return null;

        const type = this.determineAssignmentType(assignment.type);
        
        return {
            id: assignment.id.toString(),
            title: assignment.name || '',
            dueDate: new Date(assignment.due_at),
            course: card.shortName || '',
            courseId: card.id?.toString(),
            type,
            points: assignment.points_possible,
            maxPoints: assignment.points_possible,
            completed: !!assignment.has_submitted_submissions,
            priorityScore: 0,
            url: assignment.html_url,
            details: {
                submissionType: assignment.submission_types,
                isCompleted: !!assignment.has_submitted_submissions,
                isLocked: !!assignment.locked_for_user,
                description: assignment.description
            }
        };
    }

    private determineAssignmentType(type: string): AssignmentType {
        switch (type.toLowerCase()) {
            case 'quiz':
            case 'quizzes/quiz':
                return 'quiz';
            case 'discussion_topic':
                return 'discussion';
            case 'announcement':
                return 'announcement';
            default:
                return 'assignment';
        }
    }

    private isValidAssignment(assignment: Assignment | null): assignment is Assignment {
        return assignment !== null &&
            !!assignment.title &&
            !!assignment.dueDate &&
            !!assignment.course;
    }
}