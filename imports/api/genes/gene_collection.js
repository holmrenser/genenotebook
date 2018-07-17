import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const Genes = new Mongo.Collection('genes');

//create a base schema so we can add it at multiple places
const IntervalBaseSchema = new SimpleSchema({
  /*type: {
    type: String,
    allowedValues: ['gene','mRNA','tRNA','CDS','exon','three_prime_UTR','five_prime_UTR'],
    label: 'Interval type'
  },*/
  seq: {
    type: String,
    label: 'Reference sequence of this feature'
  },
  start: {
    type: Number,
    label: 'Start coordinate'
  },
  end: {
    type: Number,
    label: 'End coordinate'
  },
  score: {
    type: String,
    label: 'Score',
    custom: function(){
      if (!this.isSet){
        return 'required'
      }
      if (this.value === '.'){
        return true
      } else {
        let parsedValue = parseFloat(this.value);
        if (isNaN(parsedValue)){
          return 'scoreError'
        } else {
          return true
        }
      }
    }
  },
  attributes: {
    type: Object,
    blackbox: true,
    //index: true,
    label: 'Any attributes'
  },
  children: {
    type: Array,//[String],
    optional: true,
    label: 'Child subfeatures'
  },
  'children.$': {
    type: String
  }
});


//Define subfeature schema first so we can then add it to the gene schema
const SubfeatureSchema = new SimpleSchema({
  ID: {
    type: String,
    //unique: true,
    //index: true,
    //denyUpdate: true,
    label: 'Unique gene ID'
  },
  phase: {
    type: SimpleSchema.oneOf(Number,String),
    allowedValues: [0,1,2,'.'],
    label: 'phase'
  },
  type: {
    type: String,
    allowedValues: ['mRNA','tRNA','CDS','exon','five_prime_UTR','three_prime_UTR'],
    label: 'Subfeature types'
  },
  parents: {
    type: Array,
    label: 'Parent subfeatures'
  },
  'parents.$': {
    type: String
  },
  protein_domains: {
    type: Array,
    label: 'Interproscan protein domains',
    optional: true
  },
  'protein_domains.$': {
    type: Object,
    label: 'Interproscan protein domain',
    blackbox: true
  }
});

//extend the subfeature schema with base subfeatures
SubfeatureSchema.extend(IntervalBaseSchema);

const GeneSchema = new SimpleSchema({
  ID: {
    type: String,
    unique: true,
    index: true,
    //denyUpdate: true,
    label: 'Unique gene ID'
  },
  type: {
    type: String,
    allowedValues: ['gene'],
    label: 'Gene type'
  },
  editing: {
    type: String,
    optional: true
  },
  viewing: {
    type: Array,
    optional: true
  },
  'viewing.$': {
    type: String
  },
  changed: {
    type: Boolean,
    optional: true
  },
  subfeatures: {
    type: Array,//[SubfeatureSchema],

    optional: true,
    label: 'Array of subfeatures'
  },
  'subfeatures.$': {
    type: Object,
    blackbox: true
  },
  genomeId: { 
    type: String,
    index: true,
    label: 'Reference genome DB identifier (_id in genome collection)'
  },
  seqid: {
    type: String,
    label: 'ID of the sequence on which the gene is, e.g. chr1'
  },
  source: {
    type: String,
    label: 'Source of the annotation'
  },
  type: {
    type: String,
    allowedValues: ['gene'],
    label: 'Type of the top level annotation (currently only "gene" is allowed)'
  },
  strand: {
    type: String,
    allowedValues: ['+', '-'],
    label: 'Strand'
  }/*,
  trackId: {
    type: String,
    label: 'Annotation track DB identifier (_id in Tracks collection)'
  }*/
});

//extend the gene schema with base features
GeneSchema.extend(IntervalBaseSchema);

Genes.attachSchema(GeneSchema);

export { Genes, GeneSchema, SubfeatureSchema };