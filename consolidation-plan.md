# CanvasPal Feature Consolidation Plan

## Overview
This document outlines the features from the prototype implementation that should be consolidated into the main CanvasPal application.

## Features to Consolidate

### 1. Enhanced Assignment Detection System
- **Multi-Source Assignment Detection**
  - Planner items API integration
  - Missing submissions detection
  - Dashboard cards parsing
  - Support for multiple assignment types (quizzes, discussions, announcements)
- **Assignment Type Classification**
  - Visual indicators for different assignment types
  - Type-specific priority weighting
  - Custom weights for different assignment categories

### 2. Advanced Priority Calculation
- **Improved Priority Algorithm**
  - Grade impact calculation
  - Course grade consideration
  - Dynamic due date weighting
  - Assignment type weighting
- **Priority Weight Constants**
  ```javascript
  PRIORITY_WEIGHTS = {
    GRADE_IMPACT: 0.4,
    COURSE_GRADE: 0.3,
    DUE_DATE: 0.3
  }
  ```

### 3. Debugging and Development Tools
- **Visual Debug System**
  - Assignment highlighting with color coding
  - Date detection visualization
  - Points detection highlighting
  - Assignment type indicators
- **Logging System**
  - Multiple log levels (DEBUG, INFO, WARN, ERROR)
  - Structured logging with timestamps
  - DOM element inspection utilities
  - Debug panels for real-time monitoring

### 4. Enhanced Data Collection
- **Points Detection**
  - Multiple source checking for point values
  - Screen reader text parsing
  - API response parsing
  - DOM element inspection
- **Course Information**
  - Course name extraction
  - Grade weight detection
  - Assignment group detection

### 5. UI/UX Improvements
- **Visual Priority Indicators**
  - Color-coded priority levels
  - Priority score display
  - Assignment type icons
  - Course context display

## Implementation Priority
1. Enhanced Assignment Detection System (High Priority)
   - Critical for core functionality
   - Improves assignment coverage
   - Enables better prioritization

2. Advanced Priority Calculation (High Priority)
   - Directly impacts user experience
   - More accurate prioritization
   - Better grade impact consideration

3. Enhanced Data Collection (Medium Priority)
   - Supports better prioritization
   - Improves accuracy of recommendations
   - Better course context

4. UI/UX Improvements (Medium Priority)
   - Better user experience
   - Clearer information display
   - More intuitive interface

5. Debugging and Development Tools (Low Priority)
   - Helpful for development and maintenance
   - Not critical for end users
   - Can be implemented gradually

## Technical Considerations
- Maintain TypeScript type safety when porting features
- Consider implementing feature flags for gradual rollout
- Ensure backward compatibility with existing data structures
- Add comprehensive tests for new features
- Document API integrations and data structures

## Migration Strategy
1. Create feature branches for each major component
2. Port and test features individually
3. Review and update type definitions
4. Implement comprehensive testing
5. Gradual rollout with feature flags
6. Gather user feedback and iterate

## Timeline Recommendation
- Phase 1 (Week 1-2): Enhanced Assignment Detection
- Phase 2 (Week 2-3): Advanced Priority Calculation
- Phase 3 (Week 3-4): Enhanced Data Collection
- Phase 4 (Week 4-5): UI/UX Improvements
- Phase 5 (Week 5-6): Debugging Tools
- Week 6+: Testing, refinement, and user feedback