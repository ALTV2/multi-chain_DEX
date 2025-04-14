import React from 'react';

const Message = ({ message }) => {
  if (!message) return null;

  return (
    <div className={message.includes('successfully') ? 'success' : 'error'}>
      {message}
    </div>
  );
};

export default Message;