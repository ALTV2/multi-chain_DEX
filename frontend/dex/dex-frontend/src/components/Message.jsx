import React from 'react';

// Компонент для отображения сообщений об ошибках или успехе
const Message = ({ message }) => {
  return (
    <div className={message.includes('successfully') ? 'success' : 'error'}>
      {message}
    </div>
  );
};

export default React.memo(Message);