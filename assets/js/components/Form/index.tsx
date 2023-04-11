import React from 'react';
import { useTranslation } from "react-i18next";

function SubmitButton({onClick}) {
  const { t } = useTranslation();

  return (
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" type="submit" onClick={onClick}>{t("forms.save")}</button>
  )
}

function CancelButton({onClick}) {
  const { t } = useTranslation();

  return (
    <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded" onClick={onClick} type="button">{t("forms.cancel")}</button>
  )
}

export default function Form({children, onCancel, onSubmit}) {
  const handleSubmit = (e : Event) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form>
      {children}

      <div className="flex gap-2 mt-2">
        <SubmitButton onClick={handleSubmit} />
        <CancelButton onClick={onCancel} />
      </div>
    </form>
  )
}

Form.defaultProps = {
  children: []
}
