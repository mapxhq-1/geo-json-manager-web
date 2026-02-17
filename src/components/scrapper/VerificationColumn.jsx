import React, { useState } from 'react';

function VerificationColumn({ verification }) {
  if (!verification) {
    return (
      <div className="flex flex-col h-[800px] bg-white rounded-[15px] shadow-md overflow-hidden">
        <div className="flex items-center justify-between p-5 text-white bg-blue-600">
          <h3 className="m-0 text-xl font-bold">✓ Verification Report</h3>
        </div>
        <div className="flex-1 p-5 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-blue-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-blue-700">
          <div className="px-5 py-10 text-center text-gray-500">
            <p className="mb-2.5 text-lg">No verification data available</p>
            <small className="text-sm">Enable verification when scraping to see confidence scores</small>
          </div>
        </div>
      </div>
    );
  }

  const overallConfidence = verification.overall_confidence || 0;
  const fieldVerifications = verification.field_verifications || {};

  return (
    <div className="flex flex-col h-[800px] bg-white rounded-[15px] shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-5 text-white bg-blue-600">
        <h3 className="m-0 text-xl font-bold">✓ Verification Report</h3>
      </div>
      <div className="flex-1 p-5 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-blue-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-blue-700">
        
        <OverallScore confidence={overallConfidence} />

        <div className="p-4 mb-5 border border-gray-200 rounded-lg bg-gray-50">
          <div className="mb-2 text-sm text-gray-800">
            <strong className="text-blue-600">Verified:</strong> {new Date(verification.timestamp).toLocaleString()}
          </div>
          <div className="text-sm text-gray-800">
            <strong className="text-blue-600">Methods:</strong> {verification.methods_used?.join(', ') || 'N/A'}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-bold text-gray-800">Field-by-Field Verification</h4>
          {Object.entries(fieldVerifications).map(([fieldName, fieldData]) => (
            <FieldVerification key={fieldName} fieldName={fieldName} fieldData={fieldData} />
          ))}
        </div>
        
      </div>
    </div>
  );
}

function OverallScore({ confidence }) {
  const percentage = (confidence * 100).toFixed(0);
  
  let status = '✗ Low';
  let colorClass = 'bg-red-100 border-red-500';

  if (confidence >= 0.9) {
    status = '✓ Excellent';
    colorClass = 'bg-green-100 border-green-500';
  } else if (confidence >= 0.7) {
    status = '✓ Good';
    colorClass = 'bg-blue-100 border-blue-500';
  } else if (confidence >= 0.5) {
    status = '⚠ Moderate';
    colorClass = 'bg-yellow-100 border-yellow-500';
  }

  return (
    <div className={`p-6 mb-5 text-center border-4 rounded-xl ${colorClass}`}>
      <div className="mb-1 text-sm font-semibold text-gray-500">Overall Confidence</div>
      <div className="my-2.5 text-5xl font-bold text-gray-800">{percentage}%</div>
      <div className="mb-4 text-lg font-semibold text-gray-800">{status}</div>
      <div className="w-full h-2 overflow-hidden bg-black/10 rounded-xl">
        <div 
          className="h-full transition-all duration-500 ease-in-out bg-blue-600" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function FieldVerification({ fieldName, fieldData }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const llmVerification = fieldData.llm_verification || {};
  const crossReference = fieldData.cross_reference || {};
  const confidence = llmVerification.confidence || 0;

  let statusIcon = '✗';
  let statusClass = 'border-l-4 border-l-red-500';

  if (confidence >= 0.7) {
    statusIcon = '✓';
    statusClass = 'border-l-4 border-l-green-500';
  } else if (confidence >= 0.4) {
    statusIcon = '⚠';
    statusClass = 'border-l-4 border-l-yellow-500';
  }

  return (
    <div className={`mb-3 overflow-hidden transition-all duration-300 ease-in-out border-2 border-gray-200 rounded-lg bg-gray-50 ${statusClass}`}>
      
      {/* Accordion Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-300 hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5 font-semibold text-gray-800">
          <span className="text-xl">{statusIcon}</span>
          <span>{fieldName}</span>
        </div>
        <div className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded-full">
          {(confidence * 100).toFixed(0)}%
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="p-4 bg-white border-t border-gray-200">
          
          {llmVerification.notes && (
            <div className="mb-3">
              <strong className="block mb-1 text-sm text-blue-600">Notes:</strong>
              <p className="m-0 text-sm leading-relaxed text-gray-800">{llmVerification.notes}</p>
            </div>
          )}

          {llmVerification.alternative_facts && (
            <div className="p-2.5 mb-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-md">
              <strong className="block mb-1 text-sm text-blue-600">Alternative Facts:</strong>
              <p className="m-0 text-sm leading-relaxed text-gray-800">{llmVerification.alternative_facts}</p>
            </div>
          )}

          {crossReference.found !== undefined && (
            <div className="mb-3">
              <strong className="block mb-1 text-sm text-blue-600">Wikipedia Cross-reference:</strong>
              <p className="m-0 text-sm leading-relaxed text-gray-800">{crossReference.found ? '✓ Found' : '✗ Not found'}</p>
              {crossReference.notes && <small className="text-xs text-gray-500">{crossReference.notes}</small>}
            </div>
          )}

          <div>
            <strong className="text-sm text-blue-600">Method:</strong> <span className="text-sm text-gray-800">{llmVerification.method || 'N/A'}</span>
          </div>
          
        </div>
      )}
    </div>
  );
}

export default VerificationColumn;