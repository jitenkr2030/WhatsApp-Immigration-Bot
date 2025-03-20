const { query } = require('../database');
const logger = require('../../src/utils/logger');

class VisaModel {
  static async createApplication(applicationData) {
    const { userPhone, visaType, country, purpose, plannedDuration, expectedDeparture } = applicationData;
    
    try {
      const result = await query(
        `INSERT INTO visa_applications (
          user_phone, visa_type, country, purpose,
          planned_duration, expected_departure,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
        RETURNING *`,
        [userPhone, visaType, country, purpose, plannedDuration, expectedDeparture]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating visa application:', error);
      throw error;
    }
  }

  static async getApplicationByUser(userPhone) {
    try {
      const result = await query(
        'SELECT * FROM visa_applications WHERE user_phone = $1 ORDER BY created_at DESC',
        [userPhone]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching visa applications:', error);
      throw error;
    }
  }

  static async updateApplicationStatus(applicationId, status, notes = null) {
    try {
      const result = await query(
        `UPDATE visa_applications SET 
          status = $1,
          processing_notes = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *`,
        [status, notes, applicationId]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating visa application status:', error);
      throw error;
    }
  }

  static async deleteApplication(applicationId, userPhone) {
    try {
      const result = await query(
        'DELETE FROM visa_applications WHERE id = $1 AND user_phone = $2 RETURNING *',
        [applicationId, userPhone]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting visa application:', error);
      throw error;
    }
  }

  static async getApplicationsByStatus(status) {
    try {
      const result = await query(
        `SELECT va.*, u.name as applicant_name 
        FROM visa_applications va
        JOIN users u ON va.user_phone = u.phone_number
        WHERE va.status = $1
        ORDER BY va.created_at ASC`,
        [status]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching applications by status:', error);
      throw error;
    }
  }

  static async addProcessingUpdate(applicationId, updateData) {
    const { stage, status, notes } = updateData;
    
    try {
      const result = await query(
        `INSERT INTO visa_processing_updates (
          application_id, processing_stage, status,
          notes, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING *`,
        [applicationId, stage, status, notes]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding processing update:', error);
      throw error;
    }
  }

  static async getProcessingHistory(applicationId) {
    try {
      const result = await query(
        `SELECT * FROM visa_processing_updates
        WHERE application_id = $1
        ORDER BY created_at DESC`,
        [applicationId]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching processing history:', error);
      throw error;
    }
  }
}

module.exports = VisaModel;