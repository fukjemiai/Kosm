import { Stepper, Step, StepLabel } from '@mui/material';

const steps = ['Služba', 'Specialistka', 'Termín', 'Potvrzení'];

interface Props {
  activeStep: number;
}

export function BookingStepper({ activeStep }: Props) {
  return (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
