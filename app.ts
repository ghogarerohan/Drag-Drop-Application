// Drag and Drop Interfaces

interface Draggable {
    dragStartHandler(event :DragEvent) : void;
    dragEndHandler(event:DragEvent): void;
};

interface DragTarget{
    dragOverHandler(event:DragEvent): void
    dropHandler(event:DragEvent): void;
    dragLeaveHandler(event:DragEvent): void;
};



enum ProjectStatus {Active, Finished}

// Project Type

class Project {

    constructor(
        public id : string, 
        public title : string, 
        public description : string, 
        public people: number,
        public status : ProjectStatus ) {

    }
}

type Listener<T> = (items : T []) => void;

//class if we have mulitple states : base class for that 

class State<T> {
    protected listeners : Listener<T>[] = [];

    addlistener(listenerFn: Listener<T>){
        this.listeners.push(listenerFn)
    }
}

//Project state Management : having only one object instance in the app

class ProjectState extends State<Project>{
    
    private projects : Project[] = [];

    private static instance : ProjectState;
    private constructor() {
    super();
     }

    static getInstance(){
        if (this.instance){
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;

    }

    
    addProject(title:string, description : string, numOfPeople:number){
        const newProject = new Project(Math.random().toString(),title, description, numOfPeople, ProjectStatus.Active)
           
        this.projects.push(newProject)
        this.updateListeners();
    }

    moveProject(projectId : string,  newStatus:ProjectStatus) {
        const project = this.projects.find(prj => prj.id === projectId);
        if(project){
            project.status= newStatus;
            this.updateListeners();
        }
    }
    private updateListeners() {
        for(const listenerFn of this.listeners){
            listenerFn(this.projects.slice())
        }
    }
}

const projectState = ProjectState.getInstance();

//Validation the user inputs 
interface Validatable {
    value : string | number;
    required? : boolean;
    minLength? : number;
    maxLength? : number;
    min? : number;
    max?: number
}

function validate(validatableInput : Validatable){
    let isValid = true;
    if(validatableInput.required){
        isValid = isValid && validatableInput.value.toString().trim().length !==0;
    }
    if(validatableInput.minLength != null && typeof validatableInput.value==='string'){
        isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if(validatableInput.maxLength != null && typeof validatableInput.value==='string'){
        isValid = isValid && validatableInput.value.length >= validatableInput.maxLength;
    }
    if(validatableInput.min != null && typeof validatableInput.value==='number'){
        isValid = isValid && validatableInput.value >= validatableInput.min ;
    }
    if(validatableInput.max != null && typeof validatableInput.value==='number'){
        isValid = isValid && validatableInput.value <=validatableInput.max ;
    }
    return isValid;
}
//bind decorator
function  bind(target : any, methodName:string, descriptor: PropertyDescriptor ){
    const originalMethod = descriptor.value;
    const adjDescriptor : PropertyDescriptor ={
        configurable:true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };
    return adjDescriptor;
}


//Abstarct Base Class : should always use for inheritence 


abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(
        templateId: string,
        hostElementId: string,
        insertAtStart: boolean,
        newElementId?: string
      ) 
        {
       
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;   
        this.hostElement = document.getElementById(hostElementId)! as T;     
        const importedNode = document.importNode(this.templateElement.content,true);
        this.element =importedNode.firstElementChild as U;


        if(newElementId) {
            this.element.id = newElementId;
          }
         
        this.attach(insertAtStart);
    }
        private attach(insertAtBeginning:Boolean){
            this.hostElement.insertAdjacentElement(
                insertAtBeginning ? 'afterbegin' :'beforeend' ,
                this.element);
    }

    abstract configure() : void;

    abstract renderContent() : void
}

// ProjectItem Class : rendering single project item

class ProjectItem extends Component<HTMLUListElement,HTMLLIElement> implements Draggable {
    
    private project : Project;

    get persons() {
        if(this.project.people === 1) {
            return '1 Person'
        } else {
            return `${this.project.people} persons`
        }

    }
    
    constructor(hostId: string, project: Project){                           // taking outside of base class the construction paarmeters 
      super('single-project', hostId, false, project.id );
      this.project = project

      this.configure();
      this.renderContent();
    }
    @bind
    dragStartHandler(event:DragEvent){
        console.log('event');
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
    };

    dragEndHandler(event:DragEvent){
        console.log('DragEnd')
    };

    configure(){
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler);

    };

    renderContent(){
        this.element.querySelector('h2')!.textContent = this.project.title
        this.element.querySelector('h3')!.textContent = this.persons +' '+ 'assigned';
        this.element.querySelector('p')!.textContent = this.project.description;
    };
}


// Creating a project list entity
class ProjectList extends Component <HTMLDivElement, HTMLElement> implements DragTarget{
    // templateElement: HTMLTemplateElement;
    // hostElement: HTMLDivElement;
    // element: HTMLElement;
    
    assignedProjects: Project[];
  
    constructor(private type: 'active' | 'finished') {
        super('project-list','app',false,`${type}-projects`); // call the constructor of base class 
    //   this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
    //   this.hostElement = document.getElementById('app')! as HTMLDivElement;
  
    //   const importedNode = document.importNode(
    //     this.templateElement.content,
    //     true
    //   );
    //   this.element = importedNode.firstElementChild as HTMLElement;
    //   this.element.id = `${this.type}-projects`;
      this.assignedProjects = [];


    //   projectState.addlistener((projects : Project[]) => {
    //       const relevantProjects = projects.filter(prj => {
    //           if(this.type==='active'){
                
    //             return prj.status === ProjectStatus.Active;
    //           }    
    //             return prj.status === ProjectStatus.Finished;
              
    //         })
    //       this.assignedProjects = relevantProjects
    //       this.renderProjects(); 
    //   })



     // this.attach();
     this.configure();
      this.renderContent();
    }
    @bind
  dragOverHandler(event: DragEvent) {
    if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain'){
        event.preventDefault();
        const listEl = this.element.querySelector('ul')!;
        listEl.classList.add('droppable');
    }
    
  }

  @bind
  dropHandler(event: DragEvent) {
      const prjId = event.dataTransfer!.getData('text/plain');
      projectState.moveProject(prjId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished)
  }

  @bind
  dragLeaveHandler(_: DragEvent) {
    const listEl = this.element.querySelector('ul')!;
    listEl.classList.remove('droppable');
  }


    private renderProjects(){
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listEl.innerHTML = '';
        for(const prjItem of this.assignedProjects){
            // const listItem = document.createElement('li');
            // listItem.textContent = prjItem.title
            // listEl.appendChild(listItem)
            new ProjectItem(this.element.querySelector('ul')!.id,prjItem)
        }
    }
  
    configure(){
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);
        
        projectState.addlistener((projects : Project[]) => {
            const relevantProjects = projects.filter(prj => {
                if(this.type==='active'){
                  
                  return prj.status === ProjectStatus.Active;
                }    
                  return prj.status === ProjectStatus.Finished;
                
              })
            this.assignedProjects = relevantProjects
            this.renderProjects(); 
        })
    }

    renderContent() {
      const listId = `${this.type}-projects-list`;
      this.element.querySelector('ul')!.id = listId;
      this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
      
    }
  
    // private attach() {
    //   this.hostElement.insertAdjacentElement('beforeend', this.element);
    // }
  }

// ProjectInput Class
class ProjectInput extends Component <HTMLDivElement, HTMLFormElement>{
    // templateElement : HTMLTemplateElement;
    // hostElement : HTMLDivElement;
    // element : HTMLFormElement;

    titleInputElement : HTMLInputElement;
    descriptionInputElement : HTMLInputElement;
    peopleInputElement : HTMLInputElement;


    constructor(){
        super('project-input', 'app', true, 'user-input'); //to call the constructor of base class 
        //acccessing DoM
        // this.templateElement =  document.getElementById('project-input')! as HTMLTemplateElement;
        // this.hostElement = document.getElementById("app")! as HTMLDivElement;

        // rendering
        // const importedNode = document.importNode(this.templateElement.content, true); //passing a pointer at template element and nesting allowed
        // this.element =importedNode.firstElementChild as HTMLFormElement;
        // this.element.id= 'user-input';
        this.titleInputElement =  this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement =  this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement =  this.element.querySelector('#people') as HTMLInputElement;
        

        this.configure();
       // this.attach();
    }



        configure(){
            this.element.addEventListener('submit', this.submitHandler)
        };

        renderContent(){};
        private gatherUserInput(): [string,string,number] | void {
            const enteredTitle = this.titleInputElement.value;
            const enteredDescription = this.descriptionInputElement.value;
            const enteredPeople = this.peopleInputElement.value;

            const titleValidatable : Validatable ={
                value : enteredTitle,
                required:true,
            };
            const descriptionValidatable : Validatable ={
                value : enteredDescription,
                required:true,
                minLength:5
            };
            const peopleValidatable : Validatable ={
                value : +enteredPeople,
                required:true,
                min:1
            }
            if (!validate (titleValidatable) || 
                !validate (descriptionValidatable) || 
                !validate (peopleValidatable))
            { alert('Invalid Input.....Please try again!');
                return;
            }else {
                return[enteredTitle, enteredDescription, +enteredPeople];
            }
        }

        private clearInputs() {
            this.titleInputElement.value = '';
            this.descriptionInputElement.value = '';
            this.peopleInputElement.value = ''

        }
        @bind
        private submitHandler(event: Event){
                event.preventDefault();
                console.log(this.titleInputElement.value)
                const userInput = this.gatherUserInput();
                if(Array.isArray(userInput)) {
                    const [title, desc, people] = userInput;
                    projectState.addProject(title,desc,people);
                    console.log(title,desc,people);
                    this.clearInputs();
                }
        }

        // private  attach() {
        //     this.hostElement.insertAdjacentElement('afterbegin', this.element);

        // }
    }

    // const prjState = new ProjectState;

    const prjInput = new ProjectInput();

    const activePrjList = new ProjectList('active');

    //const activePrjList = new ProjectList(`active`);
    const finishedPrjList = new ProjectList(`finished`);