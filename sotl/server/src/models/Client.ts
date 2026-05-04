import mongoose, { Schema, Document, Model } from 'mongoose';
import User, { IUser, userSchema } from './User';

// Define the interface for Client
interface IClient extends IUser {
  // Additional fields specific to Client, if any
  batch: string;
  project: mongoose.Types.ObjectId; // Reference to the Project model
}

// Define the Client schema by extending the User schema
const clientSchema: Schema<IClient> = new Schema({
  // Any additional fields specific to Client can be defined here
  batch: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
});

// Create a model for Client using the User base schema and discriminator
const Client: Model<IClient> = User.discriminator<IClient>(
  'Client',
  clientSchema
);

export default Client;
export { IClient };