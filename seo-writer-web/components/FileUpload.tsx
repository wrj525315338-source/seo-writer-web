"use client";

interface FileUploadProps {
  name: string;
  label: string;
  multiple?: boolean;
  required?: boolean;
  accept?: string;
  help?: string;
}

export default function FileUpload({ name, label, multiple, required, accept, help }: FileUploadProps) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type="file" multiple={multiple} required={required} accept={accept} />
      {help ? <span className="help">{help}</span> : null}
    </div>
  );
}
