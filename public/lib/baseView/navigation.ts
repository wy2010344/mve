import { ArrayModel, ArrayModelItem } from "./arraymodel";
import { BView } from "./index";


interface NavigationViewItem extends ArrayModelItem{

}

class NavigationView extends ArrayModel<NavigationViewItem>{
	private view=new BView()
	getView(){return this.view}

}