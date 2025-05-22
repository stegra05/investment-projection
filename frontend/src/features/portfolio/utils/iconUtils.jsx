import React from 'react';
import {
  FaMoneyBillWave,
  FaRandom,
  FaInfoCircle,
} from 'react-icons/fa';

const getChangeTypeIcon = changeType => {
  switch (changeType) {
  case 'CONTRIBUTION':
    return <FaMoneyBillWave className="text-green-500 mr-2" />;
  case 'WITHDRAWAL':
    return <FaMoneyBillWave className="text-red-500 mr-2" />;
  case 'REALLOCATION':
    return <FaRandom className="text-blue-500 mr-2" />;
  default:
    return <FaInfoCircle className="text-gray-500 mr-2" />;
  }
};

export { getChangeTypeIcon }; 