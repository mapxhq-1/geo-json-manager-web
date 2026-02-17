import React, { useState } from 'react';

function ImagesColumn({ images, imageStates, onImageAction }) {
  const keptImages = images.filter((img) => imageStates[img.image_number]?.status === 'kept');

  return (
    // 1. ADDED h-[800px] and overflow-hidden to constrain the height
    <div className="flex flex-col w-full h-[800px] bg-white rounded-[15px] shadow-md overflow-hidden">
      
      {/* Column Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0 bg-gray-50/50">
        <h3 className="m-0 text-xl font-bold text-gray-800">Images</h3>
        <span className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-200 rounded-full">
          {keptImages.length} / {images.length} kept
        </span>
      </div>

      {/* Column Content - This is the scrollable area */}
      {/* 2. Added custom scrollbar styles to match the FieldsColumn */}
      <div className="flex flex-col flex-1 gap-5 p-5 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-blue-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-blue-700">
        {images.length === 0 ? (
          <div className="p-10 text-lg text-center text-gray-500">
            No images found
          </div>
        ) : (
          images.map((image) => (
            <ImageItem
              key={image.image_number}
              image={image}
              state={imageStates[image.image_number]}
              onAction={onImageAction}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ImageItem({ image, state, onAction }) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState(state?.caption || image.caption);
  const [imageError, setImageError] = useState(false);

  const isKept = state?.status === 'kept';
  const currentCaption = state?.caption || image.caption;

  const handleKeep = () => {
    onAction(image.image_number, 'kept', currentCaption);
  };

  const handleDelete = () => {
    onAction(image.image_number, 'deleted');
  };

  const handleSaveCaption = () => {
    onAction(image.image_number, 'kept', editedCaption);
    setIsEditingCaption(false);
  };

  const handleCancelEdit = () => {
    setEditedCaption(currentCaption);
    setIsEditingCaption(false);
  };

  return (
    <div
      className={`bg-gray-50 border-2 rounded-lg overflow-hidden transition-all duration-300 ease-in-out shrink-0 hover:shadow-md ${
        !isKept ? 'opacity-60 border-red-500' : 'border-gray-200'
      }`}
    >
      {/* Image Preview */}
      <div className="relative flex items-center justify-center w-full bg-gray-200 overflow-hidden min-h-[250px] max-h-[400px]">
        {imageError ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>Image preview unavailable</p>
          </div>
        ) : (
          <img
            src={image.url}
            alt={currentCaption}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-auto max-h-[400px] object-contain"
          />
        )}
        {!isKept && (
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white bg-red-500/80">
            DELETED
          </div>
        )}
      </div>

      {/* Image Info */}
      <div className="p-4">
        <div className="mb-2.5 text-sm font-semibold text-gray-500">
          Image #{image.image_number}
        </div>

        {/* Caption Editor vs Display */}
        {isEditingCaption ? (
          <div className="mb-2.5">
            <textarea
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              className="w-full p-2.5 mb-2.5 font-sans text-sm border-2 border-blue-600 rounded-lg resize-y focus:outline-none focus:border-blue-700"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2.5">
              <button
                onClick={handleSaveCaption}
                className="px-3 py-1.5 text-sm text-white transition-all duration-300 bg-green-500 border-none rounded-md cursor-pointer hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-sm text-gray-800 transition-all duration-300 bg-gray-200 border-none rounded-md cursor-pointer hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-2.5 text-base leading-relaxed text-gray-800">
              {currentCaption}
            </p>
            {isKept && (
              <button
                onClick={() => setIsEditingCaption(true)}
                className="py-1 mb-2.5 text-sm text-blue-600 bg-transparent border-none cursor-pointer hover:underline"
              >
                Edit Caption
              </button>
            )}
          </>
        )}

        {/* Image Actions */}
        <div className="flex gap-2.5">
          {isKept ? (
            <button
              onClick={handleDelete}
              className="flex-1 p-2.5 text-base font-semibold text-white transition-all duration-300 bg-red-500 border-none rounded-lg cursor-pointer hover:bg-red-600"
            >
              Delete
            </button>
          ) : (
            <button
              onClick={handleKeep}
              className="flex-1 p-2.5 text-base font-semibold text-white transition-all duration-300 bg-green-500 border-none rounded-lg cursor-pointer hover:bg-green-600"
            >
              Restore
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImagesColumn;