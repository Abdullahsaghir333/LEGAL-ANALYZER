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
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model('File', fileSchema);
export default File;
