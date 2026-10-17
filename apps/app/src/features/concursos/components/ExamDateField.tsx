import { Field } from "@global/components/ui";
import { formatExamDateInput } from "../utils/examDate";

type Props = { value: string; onChange: (value: string) => void };

export default function ExamDateField({ value, onChange }: Props) {
  return (
    <Field
      label="Data da prova (opcional)"
      value={value}
      onChangeText={(text) => onChange(formatExamDateInput(text))}
      placeholder="DD/MM/AAAA"
      keyboardType="numeric"
    />
  );
}
