const { Pool } = require('pg');
const { query } = require('../database');
const logger = require('../../src/utils/logger');

class UserModel {
  static async createUser(userData) {
    const { phoneNumber, name, email, age, educationLevel, workExperience, preferredCountry, financialCapacity } = userData;
    
    try {
      const result = await query(
        `INSERT INTO users (
          phone_number, name, email, age, education_level,
          work_experience, preferred_country, financial_capacity,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`,
        [phoneNumber, name, email, age, educationLevel, workExperience, preferredCountry, financialCapacity]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUserByPhone(phoneNumber) {
    try {
      const result = await query(
        'SELECT * FROM users WHERE phone_number = $1',
        [phoneNumber]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  static async updateUser(phoneNumber, updateData) {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      updateFields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount += 1;
    });

    values.push(phoneNumber);

    try {
      const result = await query(
        `UPDATE users SET 
          ${updateFields.join(', ')},
          updated_at = NOW()
        WHERE phone_number = $${paramCount}
        RETURNING *`,
        values
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(phoneNumber) {
    try {
      const result = await query(
        'DELETE FROM users WHERE phone_number = $1 RETURNING *',
        [phoneNumber]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  static async getUserProgress(phoneNumber) {
    try {
      const result = await query(
        `SELECT 
          u.*,
          v.status as visa_status,
          d.verification_status as document_status
        FROM users u
        LEFT JOIN visa_applications v ON u.phone_number = v.user_phone
        LEFT JOIN documents d ON u.phone_number = d.user_phone
        WHERE u.phone_number = $1`,
        [phoneNumber]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching user progress:', error);
      throw error;
    }
  }
}

module.exports = UserModel;