import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    file_name: {
      type: String,
      required: true,
    },
    file_url: {
      type: String,
      required: true,
    },
    file_type: {
      type: String,
    },
    linked_to: {
      type: String,
      enum: ['contract', 'case', 'other'],
      default: 'other',
    },
    case_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    extracted_text: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model('File', fileSchema);
export default File;
