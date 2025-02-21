# Software Requirements Specification: CanvasPal Chrome Extension

**1. Introduction**

1.1 Purpose
This document outlines the software requirements for CanvasPal, a Google Chrome extension designed to prioritize Canvas assignments based on due dates, grade weights, and their impact on the current grade.

1.2 Scope
CanvasPal will provide an interactive, algorithmic list of assignment priorities.  It will fetch assignment data from a user-provided iCalendar feed (URL) and optionally from the Canvas grade page. The extension will display assignments, allow for marking assignments as complete, and clearly indicate assignment importance and time remaining.

**2. Overall Description**

2.1 Product Perspective
CanvasPal is a Google Chrome extension. It will integrate with the user's Canvas instance via an iCalendar feed and optionally scrape data from the Canvas grade page.

2.2 Product Functions
* Fetch assignment data from iCalendar feed (URL).
* Optionally fetch assignment data from Canvas grade page.
* Parse assignment data (due dates, grade weights, points possible).
* Calculate assignment priority using an algorithm (details in Section 3).
* Display assignments in a prioritized list.
* Allow users to mark assignments as complete.
* Display assignment details (due date, grade weight, points possible, time remaining).

2.3 User Characteristics
CanvasPal is intended for students using Canvas.  No specific technical skills are assumed.

2.4 Operating Environment
Google Chrome browser.  Compatible with various operating systems (Windows, macOS, Linux, ChromeOS).

2.5 Design and Implementation Constraints
The extension should be lightweight and efficient.  The priority algorithm should be easily understandable and maintainable.  The UI should be intuitive and easy to use.

2.6 Assumptions and Dependencies
The iCalendar feed must be correctly formatted and accessible.  The Canvas grade page structure may change, requiring updates to the scraping logic.

**3. Specific Requirements**

3.1 External Interface Requirements
* User Interface:  A prioritized list of assignments with details.
* Hardware Interfaces:  None.
* Software Interfaces:  Google Chrome extension APIs, iCalendar parsing library.
* Communications Interfaces:  HTTP requests to fetch iCalendar and Canvas data.

3.2 Functional Requirements
* **Assignment Data Acquisition:** The extension shall fetch assignment data from a user-specified iCalendar feed URL.
* **Grade Data Acquisition (Optional):** The extension shall attempt to fetch grade data from the current Canvas grade page. If successful, it shall use this data to refine assignment priorities.
* **Priority Algorithm:** The extension shall use an algorithm to prioritize assignments based on due dates, grade weights, and impact on the current grade.  The algorithm should be configurable.
* **Assignment Display:** The extension shall display assignments in a prioritized list, showing due date, grade weight, points possible, and time remaining.
* **Completion Marking:** The extension shall allow users to mark assignments as complete.
* **Error Handling:** The extension shall handle errors gracefully (e.g., invalid iCalendar feed, inaccessible Canvas page).
* **Data Synchronization:** The extension shall periodically check for updates to the iCalendar feed and Canvas grade page.

3.3 Non-Functional Requirements
* **Usability:** The extension shall be easy to use and understand.
* **Reliability:** The extension shall be reliable and function consistently.
* **Performance:** The extension shall be responsive and not impact browser performance.
* **Maintainability:** The extension's code shall be well-structured and easy to maintain.
* **Portability:** The extension shall be compatible with different versions of Google Chrome and various operating systems.

**3.4 Priority Algorithm**

The priority algorithm will combine the following factors:

*   **Due Date:** Assignments with earlier due dates will have higher priority.
*   **Grade Weight:** Assignments with higher grade weights will have higher priority.
*   **Impact on Current Grade:** Assignments that have a greater potential to improve or lower (especially < C>) the current grade will have higher priority.

The algorithm will use a weighted sum of these factors to calculate a priority score for each assignment. The weights for each factor will be configurable by the user. This formula may change depending on our tests.

The specific formula is as follows:

Priority = (Due Date Factor * Due Date Weight) + (Grade Weight Factor * Grade Weight Weight) + (Impact Factor * Impact Weight)

Where:

*   Due Date Factor = 1 - (Time Remaining / Total Time for all assignments)
*   Grade Weight Factor = Grade Weight / 100
*   Impact Factor = (Points Possible * (1 - (Current Score / Points Earned))) / 100

The weights will be normalized to sum to 1.

**3.5 User Interface Requirements**

The extension shall provide:

*   **Assignment List View:**
	* Prioritized list of assignments
	* Each assignment shows:
		* Title
		* Due date and time remaining
		* Course name
		* Grade weight (if available)
		* Priority score
		* Completion checkbox
	* Color-coding based on priority level
	* Ability to sort by different criteria

*   **Settings Panel:**
	* iCalendar feed URL input
	* Priority algorithm weight adjustments
	* Display preferences
	* Refresh interval settings

*   **Status Indicators:**
	* Data freshness indicator
	* Error notifications
	* Sync status

**3.6 Data Storage Requirements**

The extension shall store:

*   **Local Storage:**
	* User preferences
	* iCalendar feed URL
	* Priority algorithm weights
	* Assignment completion status
	* Cache of assignment data

*   **Session Storage:**
	* Current grade data
	* Temporary calculation results
	* Active error states

*   **Data Persistence:**
	* Settings shall persist between browser sessions
	* Completion status shall persist until assignment due date passes
	* Cache shall be cleared and rebuilt periodically

**3.7 Error Handling and Debugging Requirements**

The extension shall implement:

*   **Error Handling:**
    * Graceful handling of network failures
    * Invalid iCalendar feed handling
    * Canvas page structure changes detection
    * Data parsing errors management
    * User notification of errors
    * Automatic retry mechanisms

*   **Debug Logging:**
    * Configurable log levels (ERROR, WARN, INFO, DEBUG)
    * Log file rotation and management
    * Performance metrics logging
    * Data parsing events logging
    * API call tracking
    * Error stack traces
    * User action logging

*   **Testing Requirements:**
    * Unit tests for core functionality
    * Integration tests for data parsing
    * End-to-end tests for user workflows
    * Mock data for testing
    * Test coverage reporting
    * Regression test suite
    * Performance benchmarks

*   **Monitoring:**
	* Error rate tracking
	* Performance monitoring
	* Usage statistics
	* Data freshness monitoring
	* API health checks

**3.8 Technical Design Decisions**

The extension will be implemented with the following technical choices:

*   **Architecture:**
	* Model-View-Controller (MVC) pattern
	* Event-driven architecture for UI updates
	* Service worker for background tasks
	* Modular design for easy maintenance

*   **Technologies:**
	* JavaScript/TypeScript for core functionality
	* Chrome Extension Manifest V3
	* HTML/CSS for user interface
	* Local Storage API for data persistence
	* Web Workers for heavy computations

*   **Libraries:**
	* iCal.js for iCalendar parsing
	* Moment.js for date handling
	* Jest for testing
	* ESLint for code quality
	* Webpack for bundling

*   **Development Workflow:**
	* Git for version control
	* GitHub Actions for CI/CD
	* NPM for package management
	* Chrome DevTools for debugging

**4. Future Considerations**

* **User Accounts:** Allow users to save their preferences and settings.
* **Customization:** Allow users to customize the priority algorithm.
* **Integration with other tools:** Integrate with other Canvas tools (e.g., calendar, to-do list).


**5. Appendix**

5.1 Glossary of Terms
* iCalendar: A standard format for calendar data.
* SRS: Software Requirements Specification.
