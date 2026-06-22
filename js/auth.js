function saveAuth(data) {
  localStorage.setItem('lms_token',  data.token);
  localStorage.setItem('lms_role',   data.role);
  localStorage.setItem('lms_userId', data.userId);
  localStorage.setItem('lms_user',   JSON.stringify({
    id:          data.userId,
    name:        data.fullName,
    phone:       data.phone,
    role:        data.role,
    batchId:     data.batchId     || null,
    instituteId: data.instituteId || null
  }));
}  