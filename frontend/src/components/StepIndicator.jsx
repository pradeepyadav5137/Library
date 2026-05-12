import React from 'react';
import '../styles/steps.css';

// const StepIndicator = ({ current = 1, total = 4, labels }) => {
//   // const defaultLabels = ['Verify', 'Form', 'Docs', 'Submit'];
//   // const stepLabels = labels && labels.length >= total ? labels : defaultLabels.slice(0, total);
//   const stepLabels = labels;
//   const steps = stepLabels.map((label, i) => ({ number: i + 1, label }));

//   return (
//     <div className="step-indicator">
//       {steps.map((step) => (
//         <div
//           key={step.number}
//           className={`step ${step.number < current ? 'completed' : ''} ${step.number === current ? 'active' : ''}`}
//         >
//           <div className="step-number">
//             {step.number < current ? '✓' : step.number}
//           </div>
//           <div className="step-label">{step.label}</div>
//         </div>
//       ))}
//     </div>
//   );
// };

const StepIndicator = ({ current = 1, total = 4, labels }) => {
  
  const steps = labels.map((label, i) => ({
    number: i + 1,
    label
  }));

  return (
    <div className="step-indicator">
      {steps.map((step) => (
        <div
          key={step.number}
          className={`step ${step.number < current ? 'completed' : ''} ${step.number === current ? 'active' : ''}`}
        >
          <div className="step-number">
            {step.number < current ? '✓' : step.number}
          </div>
          <div className="step-label">{step.label}</div>
        </div>
      ))}
    </div>
  );
};


export default StepIndicator;
