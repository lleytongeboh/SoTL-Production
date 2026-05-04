import mongoose, { Document, Model, CallbackError, InsertManyOptions, PreSaveMiddlewareFunction, HydratedDocument, FlatRecord, Schema } from "mongoose";

namespace AutoIncrementer {
    export interface IAutoIncrementer extends Document {
        numId: number; // for easier reference (unsafe as it may be reused if earlier document is deleted)
    }

    const getLastNumId = async (autoIncrementerModel: Model<IAutoIncrementer>, session: mongoose.ClientSession | null) => {
        const lastDoc = await autoIncrementerModel.findOne({}, {numId: 1}).sort({_id: -1 }).session(session).read(mongoose.mongo.ReadPreference.PRIMARY).lean();
        if(lastDoc?.numId) {
        return lastDoc.numId;
        }
        return 0;
    };
    
    type ExtractDocType<S> = S extends Schema<any, any, any, any, any, any, any, any, infer THydratedDocumentType> ? THydratedDocumentType : never;
    type THydratedDocumentType = ExtractDocType<Schema>;

    export const savePreMiddleware: PreSaveMiddlewareFunction<THydratedDocumentType> = async function(this, next, opts) {
        const newDoc = this;
        if (newDoc.numId) {
            next();
            return;
        }
        newDoc.numId = await getLastNumId(this.$model(), this.$session()) + 1;
        next();
    };

    export const insertManyPreMiddleware: (
            this: Model<any, any, any, any>,
            next: (err?: CallbackError) => void,
            docs: any | Array<any>,
            options?: InsertManyOptions & { lean?: boolean }
        ) => void | Promise<void>
    = async function (this, next, docs, options) {
        const session = options?.session;
        /* if(session?.clientOptions) {
            session.clientOptions.readPreference = new mongoose.mongo.ReadPreference(mongoose.mongo.ReadPreference.PRIMARY);
        } */
        const nextId = await getLastNumId(this, session ?? null) + 1;
        const docsArray = Array.isArray(docs) ? docs : [docs];

        docsArray.forEach((doc, index) => {
            doc.numId = nextId + index;
        });
        next();
    };
}

export { AutoIncrementer };