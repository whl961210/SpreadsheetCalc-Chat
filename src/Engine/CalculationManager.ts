/**
 *  This class is responsible for managing the dependencies in the sheet
 * 
 *  A cell has a property called dependsOn which is a list of cells that the cell depends on
 * 
 * This class exports the following functions
 * 
 * 0. addCellDependency(cellLabel: string, newDependsOn: string, sheetMemory: SheetMemory): boolean 
 *    - add a cell dependency to a cell, if the new dependency introduces a circular dependency, then return false
 * 1. getComputationOrder(sheetMemory: SheetMemory): string[]
 *   - get the computation order for the sheet this way the FormulaEvaluator can compute the cells in the correct order
 * 
 * Internal routines marked private
 * 
 * 1. updateDependencies(sheetMemory: SheetMemory): void
 *  - update the dependencies for all cells in the sheet
 * 2. updateComputationOrder(sheetMemory: SheetMemory): string[]
 * - update the computation order for the sheet
 * 3. expandDependencies(cellLabel: string, sheetMemory: SheetMemory): [boolean, string[]]
 * - expand the dependencies of a cell recursively 
 * 
 */

import SheetMemory from "./SheetMemory";
import Cell from "./Cell";
import FormulaBuilder from "./FormulaBuilder";
import FormulaEvaluator from "./FormulaEvaluator";



export default class CalculationManager {



    // Update the dependency graph of the sheet
    // get the computation order
    // compute the cells in the computation order
    // update the cells in the sheet memory
    public evaluateSheet(sheetMemory: SheetMemory): void {
        // update the dependencies in the sheet
        this.updateDependencies(sheetMemory);

        // compute the computation order for the sheet.
        let computationOrder = this.updateComputationOrder(sheetMemory);

        // create a new FormulaEvaluator
        let calculator = new FormulaEvaluator(sheetMemory);

        // compute the cells in the computation order
        for (let cellLabel of computationOrder) {
            let currentCell = sheetMemory.getCellByLabel(cellLabel);
            let formula = currentCell.getFormula();

            calculator.evaluate(formula);

            let value = calculator.result
            let error = calculator.error;

            // update the cell in the sheet memory
            currentCell.setError(error);
            currentCell.setValue(value);
            sheetMemory.setCellByLabel(cellLabel, currentCell);
        }
    }



    /**
     *  checck to see if it is ok to add a cell to the formula in the current cell.
     * 
     * @param {string} currentCellLabel - The label of the cell
     * @param {sheetMemory} SheetMemory - The sheet memory
     * 
     * 
     * This assumes that there is no circular dependency in the current sheet and thus if 
     * when we expand the depends on list then we will not find a circular dependency
     * if we do find a circular dependency then we return false.
     * */
    public addCellDependency(currentCellLabel: string, newDependsOnCell: string, sheetMemory: SheetMemory): boolean {
        // get the current cell
        let currentCell = sheetMemory.getCellByLabel(currentCellLabel);

        const cachedCellDependsOn: string[] = currentCell.getDependsOn();


        // We could have a formula that looks like A1 + A1 so we have already
        // checked for a dependency for this cell and we are done
        if (cachedCellDependsOn.includes(newDependsOnCell)) {
            return true;
        }

        // add the new dependency to the cell dependsOn to try to expand the dependencies
        let newCellDependsOn: string[] = [...cachedCellDependsOn, newDependsOnCell];

        /* set the test dependences for this cell */

        currentCell.setDependsOn(newCellDependsOn);

        let [isCircular, discoveredDependencies] = this.expandDependencies(currentCellLabel, currentCellLabel, sheetMemory);


        // if the cell is circular, then restore the original dependencies and return
        if (isCircular) {
            currentCell.setDependsOn(cachedCellDependsOn);
            return false;
        }

        // lets complete the dependencies for this cell.
        let expandedDependencies = [...discoveredDependencies];

        /** this cell does not introduce a circular dependency,the cell dependsOn*/
        currentCell.setDependsOn(expandedDependencies);

        // update the cell in the sheet memory
        sheetMemory.setCellByLabel(currentCellLabel, currentCell);

        // update the dependencies of the sheet
        this.updateDependencies(sheetMemory);

        // update the computation order
        this.updateComputationOrder(sheetMemory);
        return true;

    }



    /**
     * update the dependencies for all cells in the sheet
     * @param {sheetMemory} SheetMemory - The sheet memory
     * @returns {void}
     * 
     * This function will update the dependencies for all cells in the sheet
     * there are no circular dependencies in the sheet so  we just need to 
     * */
    public updateDependencies(sheetMemory: SheetMemory) {
        for (let column = 0; column < sheetMemory.getMaxColumns(); column++) {
            for (let row = 0; row < sheetMemory.getMaxRows(); row++) {
                const cellLabel = Cell.columnRowToCell(column, row);


                let currentCell = sheetMemory.getCellByLabel(cellLabel);
                let currentFormula = currentCell.getFormula();

                // always read the top level depensOn from the formula
                let currentDependsOn = FormulaBuilder.getCellReferences(currentFormula);
                currentCell.setDependsOn(currentDependsOn);

                sheetMemory.setCellByLabel(cellLabel, currentCell);


                // if the cell has no formula, then continue
                if (currentFormula.length === 0) {
                    continue;
                }

                // if the cell has no dependsOn, then continue
                if (currentDependsOn.length === 0) {
                    continue;
                }

                // if we reach here we have found a cell that references other cells
                let [isCircular, discoveredDependencies] = this.expandDependencies(cellLabel, cellLabel, sheetMemory);

                currentCell.setDependsOn(discoveredDependencies);
                sheetMemory.setCellByLabel(cellLabel, currentCell);
            }
        }
    }


    /**
     * recursively expand the dependencies of a cell
     * @param {string} cellLabel - The label of the cell
     * @param {sheetMemory} SheetMemory - The sheet memory
     */
    /**
     * 
     * For any cell with a dependency flush out the complete dependencies.
     * 
     * for each cell in the depends on look at the depends on of that cell
     * and to the list of dependencies for the cell
     */
    expandDependencies(originalCellLabel: string, cellLabel: string, sheetMemory: SheetMemory): [boolean, string[]] {
        let currentCell = sheetMemory.getCellByLabel(cellLabel);
        let cellDependsOn: string[] = currentCell.getDependsOn();
        let expandedDependencies: string[] = [];
        let isCircular: boolean = false;

        /**
         * if the cell has no dependencies, then return
         * */
        if (cellDependsOn.length === 0) {
            return [isCircular, expandedDependencies];
        }

        // if the original cell is in the list of dependencies, then the cell is circular
        // we return the cell is circular and an empty list.   
        if (cellDependsOn.indexOf(originalCellLabel) !== -1) {
            isCircular = true;
            return [isCircular, []];
        }

        /**
         * if the cell has dependencies, then expand the dependencies
         * */
        for (let i = 0; i < cellDependsOn.length; i++) {
            let currentDependency = cellDependsOn[i];

            let currentDependencyExpandedDependencies = this.expandDependencies(originalCellLabel, currentDependency, sheetMemory);
            let currentDependencyIsCircular = currentDependencyExpandedDependencies[0];
            let currentDependencyExpandedDependenciesList = currentDependencyExpandedDependencies[1];

            if (currentDependencyIsCircular) {
                isCircular = true;
                return [isCircular, []];
            }

            // if the current dependency is not circular, then add the expanded 
            // dependencies to the list of expanded dependencies
            for (let j = 0; j < currentDependencyExpandedDependenciesList.length; j++) {
                let currentDependencyExpandedDependency = currentDependencyExpandedDependenciesList[j];
                if (expandedDependencies.indexOf(currentDependencyExpandedDependency) === -1) {
                    expandedDependencies.push(currentDependencyExpandedDependency);
                }
            }

            // now we add the currentDependency to the list of expanded dependencies
            if (expandedDependencies.indexOf(currentDependency) === -1) {
                expandedDependencies.push(currentDependency);
            }

        }

        return [isCircular, expandedDependencies];
    }


    // does the computation order contain the second array (it does not matter in which order the elements are in)
    // this is a helper function for updateComputationOrder)
    private preRequisitesSatisfied(currentComputationSet: Set<string>, cellDependsOn: string[]): boolean {
        for (const cell of cellDependsOn) {
            if (currentComputationSet.has(cell) === false) {
                return false;
            }
        }
        return true;
    }

    /**
     * get the computation order for the sheet
     * @param {sheetMemory} SheetMemory - The sheet memory
     * @returns {string[]} - The computation order
     * 
     * The algorithm here is to use all of the dependency chains that are contained in the Cells
     * The cells are partitioned into independent cells and dependent cells
     * The independent cells are the cells that have no dependencies
     * The dependent cells are the cells that have dependencies
     * 
     * The algorithm adds the independent cells to the resultingComputationOrder
     * It then looks at the first cell in the cellsToBeProcessed list and if all of the dependencies 
     * of that cell are in the resultingComputationOrder, then it adds the cell to the resultingComputationOrder at the end
     * 
     * If the cell cannot be computed at this point it is then put back in the cells to be Processed.
     * 
     * There is a problem with this algorithm.  It does not detect circular dependencies.
     * therefore we are assuming that there are no circular dependencies.  The circular dependencies will be detected
     * when an attempt to add a cell reference to the formula of a cell is made.  
     * 
     * */
    public updateComputationOrder(sheetMemory: SheetMemory): string[] {
        let resultingComputationOrder: string[] = [];
        let independentCells: string[] = [];
        let cellsToBeProcessed: string[] = [];


        // first split the cells into independent and dependent cells (cellsToBeProcessed)
        for (let column = 0; column < sheetMemory.getMaxColumns(); column++) {
            for (let row = 0; row < sheetMemory.getMaxRows(); row++) {
                let currentLabel = Cell.columnRowToCell(column, row);
                const currentCell = sheetMemory.getCellByLabel(currentLabel);

                if (currentCell.getDependsOn().length === 0) {
                    independentCells.push(currentLabel);
                }
                else {
                    cellsToBeProcessed.push(currentLabel);
                }
            }
        }

        // now add the independent cells to the computation order
        resultingComputationOrder = [...independentCells];

        // now add the dependent cells to the computation order
        while (cellsToBeProcessed.length > 0) {
            let currentCell = cellsToBeProcessed.shift()!; // Assertion that this is non undefined

            let currentCellDependsOn = sheetMemory.getCellByLabel(currentCell).getDependsOn();
            let currentComputationSet = new Set(resultingComputationOrder);

            // if the currentCellDepends on is a subset of the currentComputationSet, then add the currentCell to 
            //the computation order after all the ones that are already there
            // otherwise put it at the end of the cellToBeProcessed list

            if (this.preRequisitesSatisfied(currentComputationSet, currentCellDependsOn)) {
                resultingComputationOrder.push(currentCell);
            }
            else {
                cellsToBeProcessed.push(currentCell);
            }
        }

        return resultingComputationOrder;
    }


}



