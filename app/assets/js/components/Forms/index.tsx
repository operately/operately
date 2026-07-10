import { SubmitButton } from "./SubmitButton";
import { Form } from "./Form";
import { Submit } from "./Submit";
import { TextInput } from "./TextInput";
import { TitleInput } from "./TitleInput";
import { SelectBox } from "./SelectBox";
import { FieldGroup } from "./FieldGroup";
import { InputField } from "./FieldGroup";
import { RadioButtons } from "./RadioButtons";
import { PasswordInput } from "./PasswordInput";
import { CheckboxInput } from "./CheckboxInput";
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
  InputField,
  RadioButtons,
  PasswordInput,
  CheckboxInput,
  NumberInput,
  ErrorMessage,
  FormError,
};
