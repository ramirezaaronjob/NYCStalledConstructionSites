import React from 'react';

const MLView = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Machine Learning Insights</h2>
      <iframe
        src="/team030poster.pdf"
        width="100%"
        height="1600px"
        style={{ border: 'none' }}
        title="Team 030 Poster"
      ></iframe>
    </div>
  );
};

export default MLView;
