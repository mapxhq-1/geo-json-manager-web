import React, { useState } from 'react';

function FieldsColumn({ fields, editedFields, onFieldEdit }) {
  const [editingField, setEditingField] = useState(null);

  const handleEdit = (fieldName) => {
    setEditingField(fieldName);
  };

  const handleSave = (fieldName, value) => {
    onFieldEdit(fieldName, value);
    setEditingField(null);
  };

  const handleCancel = () => {
    setEditingField(null);
  };

  const getFieldValue = (fieldName) => {
    return editedFields[fieldName] !== undefined ? editedFields[fieldName] : fields[fieldName];
  };

  const isEdited = (fieldName) => {
    return editedFields[fieldName] !== undefined;
  };

  return (
    <div className="flex flex-col h-[800px] overflow-hidden bg-white rounded-[15px] shadow-md">
      {/* Column Header */}
      <div className="flex items-center justify-between p-5 text-white bg-blue-600">
        <h3 className="m-0 text-xl font-bold">Extracted Fields</h3>
        <span className="px-4 py-1.5 text-sm bg-white/20 rounded-full">
          {Object.keys(fields).length} fields
        </span>
      </div>
      
      {/* Column Content with Custom Scrollbar */}
      <div className="flex-1 p-5 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-blue-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-blue-700">
        {Object.entries(fields).map(([fieldName, fieldValue]) => (
          <FieldItem
            key={fieldName}
            fieldName={fieldName}
            fieldValue={getFieldValue(fieldName)}
            isEditing={editingField === fieldName}
            isEdited={isEdited(fieldName)}
            onEdit={() => handleEdit(fieldName)}
            onSave={(value) => handleSave(fieldName, value)}
            onCancel={handleCancel}
          />
        ))}
      </div>
    </div>
  );
}

function FieldItem({ fieldName, fieldValue, isEditing, isEdited, onEdit, onSave, onCancel }) {
  const [editValue, setEditValue] = useState(fieldValue);

  const handleSaveClick = () => {
    onSave(editValue);
  };

  return (
    <div
      className={`p-4 mb-4 transition-all duration-300 ease-in-out border-2 rounded-lg hover:shadow-md ${
        isEdited ? 'bg-yellow-50 border-yellow-500' : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* Field Name & Badge */}
      <div className="flex items-center justify-between mb-2.5 font-semibold text-gray-800">
        {fieldName}
        {isEdited && (
          <span className="px-2 py-[3px] text-xs text-white bg-yellow-500 rounded">
            Edited
          </span>
        )}
      </div>

      {/* Edit Mode vs View Mode */}
      {isEditing ? (
        <div className="flex flex-col gap-2.5">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full p-2.5 font-sans text-[0.95rem] border-2 border-blue-600 rounded-lg resize-y min-h-[80px] focus:outline-none focus:border-blue-700"
            rows={4}
            autoFocus
          />
          <div className="flex gap-2.5">
            <button
              onClick={handleSaveClick}
              className="px-4 py-2 text-sm text-white transition-all duration-300 bg-green-500 border-none rounded cursor-pointer hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-800 transition-all duration-300 bg-gray-200 border-none rounded cursor-pointer hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="m-0 leading-relaxed text-gray-800">{fieldValue}</p>
          <button
            onClick={onEdit}
            className="self-start px-4 py-2 text-sm text-white transition-colors duration-300 bg-blue-600 border-none rounded cursor-pointer hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

export default FieldsColumn;