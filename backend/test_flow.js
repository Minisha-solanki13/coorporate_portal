// Node.js 18+ has built-in fetch. Run with: node test_flow.js
async function testFlow() {
  const baseUrl = 'http://localhost:5000/api';

  console.log('--- STARTING FLOW TEST ---');

  // 1. Login as Employee
  console.log('1. Logging in as Employee...');
  let loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'employee@company.com', password: 'employee123' })
  });
  let loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error('Employee login failed');
  const employeeToken = loginData.token;
  console.log('Employee logged in successfully.');

  // 2. Get Employee Review to initialize/fetch
  console.log('2. Fetching Employee review...');
  let reviewRes = await fetch(`${baseUrl}/reviews/my-review`, {
    headers: { 'Authorization': `Bearer ${employeeToken}` }
  });
  let reviewData = await reviewRes.json();
  if (!reviewRes.ok) throw new Error('Failed to fetch employee review');
  console.log(`Review status: ${reviewData.status}`);

  // 3. Submit Employee Self-Assessment
  if (reviewData.status === 'Draft') {
    console.log('3. Submitting Employee Self-Assessment...');
    const submittedRatings = reviewData.ratings.map(q => ({
      questionId: q.questionId,
      employeeRating: Math.floor(Math.random() * 3) + 3, // 3, 4, or 5
      employeeComment: `Doing well in aspect ${q.questionId}`
    }));

    let submitRes = await fetch(`${baseUrl}/reviews/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${employeeToken}`
      },
      body: JSON.stringify({ ratings: submittedRatings })
    });
    let submitData = await submitRes.json();
    if (!submitRes.ok) throw new Error(`Employee submission failed: ${submitData.message}`);
    console.log('Employee self-assessment submitted.');
    reviewData = submitData.review;
  } else {
    console.log(`Employee self-assessment already submitted (status: ${reviewData.status})`);
  }

  // 4. Login as Manager
  console.log('4. Logging in as Manager...');
  loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@company.com', password: 'manager123' })
  });
  loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error('Manager login failed');
  const managerToken = loginData.token;
  console.log('Manager logged in successfully.');

  // Find Jane Doe's review ID
  console.log('5. Fetching pending manager reviews...');
  let pendingRes = await fetch(`${baseUrl}/reviews/pending-manager`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  let pendingReviews = await pendingRes.json();
  if (!pendingRes.ok) throw new Error('Failed to fetch pending reviews');
  
  const janeReview = pendingReviews.find(r => r.employeeId.email === 'employee@company.com');
  if (!janeReview) {
    throw new Error('Could not find Jane Doe review in pending manager list');
  }
  console.log(`Found Jane Doe review. Status: ${janeReview.status}`);

  // 6. Submit Manager Evaluation
  if (janeReview.status === 'Submitted') {
    console.log('6. Submitting Manager Evaluation...');
    const managerRatings = janeReview.ratings.map(q => ({
      questionId: q.questionId,
      managerRating: Math.floor(Math.random() * 3) + 3, // 3, 4, or 5
      managerComment: `Manager feedback for aspect ${q.questionId}`
    }));

    let managerSubmitRes = await fetch(`${baseUrl}/reviews/manager-submit/${janeReview._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managerToken}`
      },
      body: JSON.stringify({ 
        ratings: managerRatings,
        managerFeedback: 'Jane has demonstrated consistent leadership and delivered high quality work this cycle.'
      })
    });
    let mgrData = await managerSubmitRes.json();
    if (!managerSubmitRes.ok) throw new Error(`Manager submission failed: ${mgrData.message}`);
    console.log('Manager evaluation submitted successfully.');
  } else {
    console.log(`Manager evaluation already done (status: ${janeReview.status})`);
  }

  // 7. Login as HR
  console.log('7. Logging in as HR...');
  loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hr@company.com', password: 'hr123' })
  });
  loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error('HR login failed');
  const hrToken = loginData.token;
  console.log('HR logged in successfully.');

  // Find review
  console.log('8. Fetching all reviews for HR...');
  let allRes = await fetch(`${baseUrl}/reviews/all`, {
    headers: { 'Authorization': `Bearer ${hrToken}` }
  });
  let allReviews = await allRes.json();
  const janeReviewHR = allReviews.find(r => r.employeeId.email === 'employee@company.com');
  if (!janeReviewHR) {
    throw new Error('Jane review not found by HR');
  }
  console.log(`Jane Doe review status for HR: ${janeReviewHR.status}`);

  if (janeReviewHR.status === 'Manager Reviewed') {
    console.log('9. Finalizing review as HR...');
    let finalizeRes = await fetch(`${baseUrl}/reviews/hr-finalize/${janeReviewHR._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        hrRemarks: 'Jane has performed exceptionally well this cycle. Strong communication and prompt delivery.',
        discussionNotes: 'The appraisal committee discussed Jane\'s contributions and agreed she is ready for promotion to Senior Engineer.',
        appraisalPercentage: 12.5,
        promotionRecommended: true
      })
    });
    let finalData = await finalizeRes.json();
    if (!finalizeRes.ok) throw new Error(`HR finalization failed: ${finalData.message}`);
    console.log('HR finalized review successfully.');
    console.log('Final Score:', finalData.review.calculatedScores.finalScore);
  } else {
    console.log(`Review not in Manager Reviewed status (current: ${janeReviewHR.status})`);
  }

  console.log('--- TEST FLOW COMPLETED ---');
}

testFlow().catch(err => {
  console.error('Error in flow:', err);
});
