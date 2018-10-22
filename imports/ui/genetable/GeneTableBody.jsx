import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';
import dot from 'dot-object';

import { Genes } from '/imports/api/genes/gene_collection.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

import Genemodel from '/imports/ui/singleGenePage/Genemodel.jsx';
import ProteinDomains from '/imports/ui/singleGenePage/ProteinDomains.jsx';
import GeneExpression from '/imports/ui/singleGenePage/geneExpression/GeneExpression.jsx';
import AttributeValue from '/imports/ui/singleGenePage/generalInfo/AttributeValue.jsx';

import './geneTableBody.scss';

const ExpressionViz = ({ gene }) => {
  return <SampleSelection gene={gene}>
    <ExpressionPlot />
  </SampleSelection>
} 

const VISUALIZATIONS = {
  'Gene model': Genemodel,
  'Protein domains': ProteinDomains,
  'Gene expression': GeneExpression
}

/**
 * Reactive Meteor tracker for GeneTable component
 * @param  {Object} options.query           [description]
 * @param  {Number} options.scrollLimit     [description]
 * @param  {Set} options.selectedGenes   [description]
 * @param  {Function} options.updateSelection [description]
 * @param  {Boolean} options.selectedAll     [description]
 * @return {Object}                         [description]
 */
const dataTracker = ({ query = {}, sort = {ID: 1}, limit = 40, selectedGenes, updateSelection, selectedAll }) => {
  const geneSub = Meteor.subscribe('genes', { query, sort, limit });
  const loading = !geneSub.ready();
  const genes = Genes.find(query, { limit, sort }).fetch();
  
  return { genes, loading, selectedGenes, updateSelection, selectedAll }
}

/**
 * [description]
 * @param  {[type]} props [description]
 * @return {[type]}       [description]
 */
const hasNoResults = ({ genes }) => {
  return typeof genes === 'undefined' || genes.length === 0
}

/**
 * [description]
 * @param  {[type]} props [description]
 * @return {[type]}       [description]
 */
const NoResults = ({selectedColumns, ...props}) => {
  const colSpan = selectedColumns.size + 3;
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan}>
          <div className='alert alert-danger' role='alert'>
            Your query returned no results
          </div>
        </td>
      </tr>
    </tbody>
  )
}

/**
 * [description]
 * @param  {[type]} options.genes   [description]
 * @param  {[type]} options.loading [description]
 * @return {[type]}                 [description]
 */
const isLoading = ({genes, loading}) => {
  return loading && genes.length === 0
}

/**
 * [description]
 * @param  {[type]}    options.selectedColumns [description]
 * @param  {...[type]} options.props           [description]
 * @return {[type]}                            [description]
 */
const Loading = ({selectedColumns, ...props}) => {
  const colSpan = selectedColumns.size + 3;
  return (
    <tbody>
    {
      Array(10).fill().map((_,i)=>{
        return (
          <tr key={i}>
            <td colSpan={colSpan}>
              <div className='alert alert-light' role='alert'>
                Loading...
              </div>
            </td>
          </tr>
        )
      })
    }
    </tbody>
  )
}

/**
 * [withConditionalRendering description]
 * @type {[type]}
 */
const withConditionalRendering = compose(
  withTracker(dataTracker),
  withEither(isLoading, Loading),
  withEither(hasNoResults, NoResults)
)

const GeneLink = ({ geneId }) => {
  return <a className='genelink' title={geneId} 
    href={`${Meteor.absoluteUrl()}gene/${geneId}`}>
    { geneId }
  </a>
}

const AttributeColumn = ({ attributeName, attributeValue, geneId }) => {
  return <td data-label={attributeName}>
    {
      attributeName === 'Gene ID' ?
      <GeneLink {...{ geneId }} /> :
      attributeValue && <AttributeValue {...{ attributeValue }} />
    }
  </td>
}

/**
 * [description]
 * @param  {[type]} options.gene             [description]
 * @param  {[type]} options.selectedColumns  [description]
 * @param  {[type]} options.selectedAllGenes [description]
 * @param  {[type]} options.selectedGenes    [description]
 * @param  {[type]} options.updateSelection  [description]
 * @return {[type]}                          [description]
 */
const GeneTableRow = ({ gene, selectedColumns, selectedAllGenes, selectedGenes, 
  updateSelection, attributes, selectedVisualization, ...props }) => {
  const selected = selectedAllGenes || selectedGenes.has(gene.ID)
  const color = selected ? 'black' : 'white';
  const selectedAttributes = attributes.filter(attribute => {
    return selectedColumns.has(attribute.name)
  }).reduce((obj, attribute) => {
    obj[attribute.name] = attribute
    return obj
  },{})

  const DataVisualization = VISUALIZATIONS[selectedVisualization];

  return <tr>
    {
      [...selectedColumns].map(attributeName => {
        const attribute = selectedAttributes[attributeName]
        const attributeValue = dot.pick(attribute.query, gene)
        return <AttributeColumn key={attributeName}
          {...{ attributeName, attributeValue, geneId: gene.ID }} />
      })
    }
    <td data-label={selectedVisualization} style={{width: '20rem'}}>
      <DataVisualization gene={gene} resizable={true} height={100} />
    </td>
    <td>
      <button type="button" className="btn btn-sm btn-outline-dark pull-right px-1 py-0"
        id={gene.ID} onClick={updateSelection.bind(this)} >
        <span id={gene.ID} className='icon-check' aria-hidden="true" style={{color}} />
      </button>
    </td>
  </tr>
}


class GeneTableBody extends React.PureComponent {
  constructor(props){
    super(props)
  }
  componentDidMount = () => {
    window.addEventListener('scroll', this.onScroll, false);
  }

  componentWillUnmount = () => {
    window.removeEventListener('scroll', this.onScroll, false);
  }

  onScroll = () => {
    if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 500)){
      this.props.updateScrollLimit(this.props.limit + 10)
    }
  }
  render(){
    const { genes, ...props } = this.props;
    return (
      <tbody className='genetable-body'>
        {
          genes.map(gene => {
            return <GeneTableRow key={gene.ID} gene={gene} {...props} />
          })
        }
      </tbody>
    )
  }
}


export default withConditionalRendering(GeneTableBody)