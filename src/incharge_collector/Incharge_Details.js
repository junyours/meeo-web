import React, { useState, useEffect } from 'react';
import api from '../Api';
import '../assets/vendorprofile.css';

const InchargeProfile = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    age: '',
    gender: '',
    contact_number: '',
    emergency_contact: '',
    address: '',
  });

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/incharge-details', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (response.data) {
          const data = response.data;

          setProfile(data);
          setFormData({
            fullname: data.fullname || '',
            age: data.age || '',
            gender: data.gender || '',
            contact_number: data.contact_number || '',
            emergency_contact: data.emergency_contact || '',
            address: data.address || '',
          });

          const isSubmitted =
            data.fullname &&
            data.age &&
            data.gender &&
            data.contact_number &&
            data.emergency_contact &&
            data.address;

          setSubmitted(isSubmitted);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const response = await api.post('/incharge-details', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      setProfile(response.data);
      setSubmitted(true);
      setEditMode(false);
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error submitting profile:', error);
      alert('Failed to save profile.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="profile-container">
      <h2>Incharge Profile</h2>

      {loading ? (
        <div>
          <div className="skeleton" style={{ width: '60%' }}></div>
          <div className="skeleton" style={{ width: '80%' }}></div>
          <div className="skeleton" style={{ width: '70%' }}></div>
          <div className="skeleton" style={{ width: '90%' }}></div>
          <div className="skeleton" style={{ width: '85%' }}></div>
          <div className="skeleton" style={{ width: '75%' }}></div>
        </div>
      ) : !submitted || editMode ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Fullname:</label><br />
            <input name="fullname" value={formData.fullname} onChange={handleChange} required />
          </div>

          <div>
            <label>Age:</label><br />
            <input name="age" value={formData.age} onChange={handleChange} required />
          </div>

          <div>
            <label>Gender:</label><br />
            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">--Select--</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div>
            <label>Contact Number:</label><br />
            <input name="contact_number" value={formData.contact_number} onChange={handleChange} required />
          </div>

          <div>
            <label>Emergency Contact:</label><br />
            <input name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} required />
          </div>

          <div>
            <label>Address:</label><br />
            <input name="address" value={formData.address} onChange={handleChange} required />
          </div>

          <br />
          <button type="submit" disabled={formSubmitting}>
            {formSubmitting ? <div className="spinner"></div> : editMode ? 'Update Profile' : 'Submit Profile'}
          </button>
        </form>
      ) : (
        <div className="profile-summary">
          <h3>Profile Summary</h3>
          <p><strong>Fullname:</strong> {profile.fullname}</p>
          <p><strong>Age:</strong> {profile.age}</p>
          <p><strong>Gender:</strong> {profile.gender}</p>
          <p><strong>Contact Number:</strong> {profile.contact_number}</p>
          <p><strong>Emergency Contact:</strong> {profile.emergency_contact}</p>
          <p><strong>Address:</strong> {profile.address}</p>
          <p><strong>Status:</strong> {profile.Status}</p>

          <br />
          <button onClick={() => setEditMode(true)}>
            Update Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default InchargeProfile;
