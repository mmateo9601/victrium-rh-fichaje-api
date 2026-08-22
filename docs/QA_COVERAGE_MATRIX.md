# QA Coverage Matrix

| Area | Unit | Integration | API e2e | White-box | Boundary | Negative | Security |
| --- | --- | --- | --- | --- | --- | --- | --- |
| auth | pass | pass | pass | pass | pass | pass | pass |
| clock | pass | pass | pass | pass | pass | pass | pass |
| planning | pass | pass | pass | pass | pass | pass | pass |
| roles | pass | pass | pass | pass | pass | pass | pass |
| tenant | pass | pass | pass | pass | pass | pass | pass |
| time calculations | pass | pass | pass | pass | pass | pass | pass |
| shifts | pass | pass | pass | pass | pass | pass | pass |
| rotations | pass | pass | pass | pass | pass | pass | pass |
| vacations | pass | pass | pass | pass | pass | pass | pass |
| permissions | pass | pass | pass | pass | pass | pass | pass |
| incidents | pass | pass | pass | pass | pass | pass | pass |
| settings | partial | partial | partial | partial | partial | partial | partial |

## Notes
- Browser e2e, responsive, accessibility and usability are primarily covered in the web repo.
- Concurrency risk is centered on time-entry session transitions and versioned corrections.
