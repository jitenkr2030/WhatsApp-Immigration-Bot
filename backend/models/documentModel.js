const { query } = require('../database');
const logger = require('../../src/utils/logger');

class DocumentModel {
  static async createDocument(documentData) {
    const { userPhone, documentType, documentPath, verificationStatus = 'pending' } = documentData;
    
    try {
      const result = await query(
        `INSERT INTO documents (
          user_phone, document_type, document_path,
          verification_status, uploaded_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *`,
        [userPhone, documentType, documentPath, verificationStatus]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating document record:', error);
      throw error;
    }
  }

  static async getDocumentsByUser(userPhone) {
    try {
      const result = await query(
        'SELECT * FROM documents WHERE user_phone = $1 ORDER BY uploaded_at DESC',
        [userPhone]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching user documents:', error);
      throw error;
    }
  }

  static async updateDocumentStatus(documentId, status, verificationNotes = null) {
    try {
      const result = await query(
        `UPDATE documents SET 
          verification_status = $1,
          verification_notes = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *`,
        [status, verificationNotes, documentId]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating document status:', error);
      throw error;
    }
  }

  static async deleteDocument(documentId, userPhone) {
    try {
      const result = await query(
        'DELETE FROM documents WHERE id = $1 AND user_phone = $2 RETURNING *',
        [documentId, userPhone]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  static async getDocumentsByType(userPhone, documentType) {
    try {
      const result = await query(
        'SELECT * FROM documents WHERE user_phone = $1 AND document_type = $2',
        [userPhone, documentType]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching documents by type:', error);
      throw error;
    }
  }

  static async getPendingVerifications() {
    try {
      const result = await query(
        `SELECT d.*, u.name as user_name 
        FROM documents d
        JOIN users u ON d.user_phone = u.phone_number
        WHERE d.verification_status = 'pending'
        ORDER BY d.uploaded_at ASC`
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching pending verifications:', error);
      throw error;
    }
  }
}

module.exports = DocumentModel;