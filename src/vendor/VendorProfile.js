import React, { useState, useEffect } from 'react';
import api from '../Api';
import '../assets/vendorprofile.css';

const VendorProfile = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    age: '',
    gender: '',
    contact_number: '',
    emergency_contact: '',
    address: '',
    Business_permit: false,
    Sanitary_permit: false,
    Dti_permit: false,
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
        const response = await api.get('/vendor-details', {
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
            Business_permit: data.Business_permit || false,
            Sanitary_permit: data.Sanitary_permit || false,
            Dti_permit: data.Dti_permit || false,
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
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const response = await api.post('/vendor-details', formData, {
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
      <h2>My Profile</h2>

      {loading ? (
        <div>
          <div className="skeleton" style={{ width: '60%' }}></div>
          <div className="skeleton" style={{ width: '80%' }}></div>
          <div className="skeleton" style={{ width: '70%' }}></div>
          <div className="skeleton" style={{ width: '90%' }}></div>
          <div className="skeleton" style={{ width: '85%' }}></div>
          <div className="skeleton" style={{ width: '75%' }}></div>
        </div>
      ) : !submitted || editMode || profile?.Status !== 'approved' ? (
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

          <div>
            <label>
              <input type="checkbox" name="Business_permit" checked={formData.Business_permit} onChange={handleChange} />
              Business Permit
            </label>
          </div>

          <div>
            <label>
              <input type="checkbox" name="Sanitary_permit" checked={formData.Sanitary_permit} onChange={handleChange} />
              Sanitary Permit
            </label>
          </div>

          <div>
            <label>
              <input type="checkbox" name="Dti_permit" checked={formData.Dti_permit} onChange={handleChange} />
              DTI Permit
            </label>
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
          <p><strong>Business Permit:</strong> {profile.Business_permit ? 'Yes' : 'No'}</p>
          <p><strong>Sanitary Permit:</strong> {profile.Sanitary_permit ? 'Yes' : 'No'}</p>
          <p><strong>DTI Registration:</strong> {profile.Dti_permit ? 'Yes' : 'No'}</p>

          <br />
          <button onClick={() => setEditMode(true)}>
            Update Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorProfile;
