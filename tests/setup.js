import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let replSet;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '5001';
  process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-minimum-32-characters-long-key';
  process.env.CLIENT_URL = 'http://localhost:3000';

  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  const uri = replSet.getUri();
  process.env.MONGO_URI = uri;

  await mongoose.connect(uri);
}, 60000);

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (replSet) {
    await replSet.stop();
  }
});
