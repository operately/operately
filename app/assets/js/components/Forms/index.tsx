import { SubmitButton } from "./SubmitButton";
import { Form } from "./Form";
import { Submit } from "./Submit";
import { TextInput } from "./TextInput";
import { TitleInput } from "./TitleInput";
import { SelectBox } from "./SelectBox";
import { FieldGroup } from "./FieldGroup";
import { SelectGoal } from "./SelectGoal";
import { InputField } from "./FieldGroup";
import { RadioButtons } from "./RadioButtons";
import { SelectPerson } from "./SelectPerson";
import { RichTextArea } from "./RichTextArea";
import { PasswordInput } from "./PasswordInput";
import { CheckboxInput } from "./CheckboxInput";
import { SelectStatus } from "./SelectStatus";
import { NumberInput } from "./NumberInput";
import { ErrorMessage } from "./ErrorMessage";
import { FormError } from "./FormError";

import { useForm } from "./useForm";
import { useFieldError, useFieldValue } from "./FormContext";

export type { FormState } from "./useForm";
export type { FieldObject } from "./useForm/field";

export default {
  useForm,
  useFieldError,
  useFieldValue,

  SubmitButton,
  Form,
  Submit,
  TextInput,
  TitleInput,
  SelectBox,
  FieldGroup,
  SelectGoal,
  InputField,
  RadioButtons,
  RichTextArea,
  SelectPerson,
  PasswordInput,
  CheckboxInput,
  SelectStatus,
  NumberInput,
  ErrorMessage,
  FormError,
};
